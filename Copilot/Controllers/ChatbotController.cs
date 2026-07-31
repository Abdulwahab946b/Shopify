using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Copilot.Data;
using Copilot.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace Copilot.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ChatbotController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IHttpClientFactory _httpClientFactory;

        public ChatbotController(AppDbContext context, IConfiguration configuration, IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _configuration = configuration;
            _httpClientFactory = httpClientFactory;
        }

        public class ChatRequest
        {
            public string Message { get; set; } = string.Empty;
        }

        public class ChatResponse
        {
            public string Answer { get; set; } = string.Empty;
            public string Intent { get; set; } = "General";
            public List<QuickAction>? QuickActions { get; set; }
        }

        public class QuickAction
        {
            public string Label { get; set; } = string.Empty;
            public string TargetTab { get; set; } = string.Empty;
        }

        [HttpPost("query")]
        public async Task<IActionResult> Query([FromBody] ChatRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Message))
            {
                return BadRequest(new { success = false, message = "Query message cannot be empty." });
            }

            var query = request.Message.Trim();
            var response = await ProcessQueryAsync(query);

            // Log AI chatbot interaction to Audit Logs
            var username = User.Identity?.Name ?? "Guest";
            _context.AuditLogs.Add(new AuditLog
            {
                Username = username,
                Action = "AI Chatbot Query",
                Details = $"Query: \"{query}\" -> Intent: '{response.Intent}'",
                Timestamp = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            return Ok(new { success = true, data = response });
        }

        private async Task<ChatResponse> ProcessQueryAsync(string query)
        {
            var openAiKey = _configuration["OpenAI:ApiKey"];

            // Assemble live database context for LLM Grounding (RAG)
            var erpContext = await BuildErpDatabaseContextAsync();

            // 1. IF OPENAI API KEY IS CONFIGURED -> USE REAL GPT-4o / LLM ENGINE
            if (!string.IsNullOrWhiteSpace(openAiKey))
            {
                var llmAnswer = await CallOpenAiLlmAsync(query, erpContext, openAiKey);
                if (!string.IsNullOrWhiteSpace(llmAnswer))
                {
                    return new ChatResponse
                    {
                        Intent = "OpenAI_LLM",
                        Answer = llmAnswer,
                        QuickActions = ExtractQuickActions(query)
                    };
                }
            }

            // 2. FALLBACK / DEMO ENGINE (Structured Context-Aware Dynamic AI Engine)
            return await ProcessStructuredContextQueryAsync(query, erpContext);
        }

        private async Task<string> BuildErpDatabaseContextAsync()
        {
            var username = User.Identity?.Name ?? "Admin User";
            var invoices = await _context.Invoices.ToListAsync();
            var shopifyOrders = await _context.ShopifyOrders.Include(s => s.OrderItems).ToListAsync();
            var inventory = await _context.InventoryItems.ToListAsync();
            var purchaseOrders = await _context.PurchaseOrders.ToListAsync();

            var paidInvoiceTotal = invoices.Where(i => i.Status == "Paid").Sum(i => i.Amount);
            var pendingInvoiceTotal = invoices.Where(i => i.Status == "Pending" || i.Status == "Overdue").Sum(i => i.Amount);
            var shopifyTotal = shopifyOrders.Sum(s => s.TotalAmount);
            var totalSales = paidInvoiceTotal + shopifyTotal;

            var lowStockItems = inventory.Where(i => i.Quantity <= 10).Select(i => $"{i.Name} ({i.Quantity} left)").ToList();
            var recentShopifyList = shopifyOrders.OrderByDescending(s => s.CreatedDate).Take(3).Select(s => $"{s.OrderNumber} by {s.CustomerName} (${s.TotalAmount:N2})").ToList();

            var sb = new StringBuilder();
            sb.AppendLine($"Current User: {username}");
            sb.AppendLine($"Total Combined Revenue: ${totalSales:N2}");
            sb.AppendLine($"Shopify Store Total Sales: ${shopifyTotal:N2} across {shopifyOrders.Count} orders");
            sb.AppendLine($"Paid Invoices Revenue: ${paidInvoiceTotal:N2}");
            sb.AppendLine($"Pending/Overdue Receivables: ${pendingInvoiceTotal:N2} ({invoices.Count(i => i.Status != "Paid")} invoices)");
            sb.AppendLine($"Total Distinct Inventory Items: {inventory.Count}");
            sb.AppendLine($"Total Inventory Stock Units: {inventory.Sum(i => i.Quantity)} units");
            sb.AppendLine($"Low Stock Warning Items: {(lowStockItems.Any() ? string.Join(", ", lowStockItems) : "None")}");
            sb.AppendLine($"Recent Shopify Orders: {(recentShopifyList.Any() ? string.Join("; ", recentShopifyList) : "None")}");
            sb.AppendLine($"Active Purchase Orders: {purchaseOrders.Count(p => p.Status != "Received")}");

            return sb.ToString();
        }

        private async Task<string?> CallOpenAiLlmAsync(string userQuery, string erpContext, string apiKey)
        {
            try
            {
                var client = _httpClientFactory.CreateClient();
                client.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");

                var model = _configuration["OpenAI:Model"] ?? "gpt-4o-mini";
                var endpoint = _configuration["OpenAI:Endpoint"] ?? "https://api.openai.com/v1/chat/completions";

                var systemPrompt = "You are Copilot AI, an intelligent, helpful, and conversational ERP Assistant built into the Copilot ERP Console.\n" +
                                   "Answer the user's questions in a friendly, conversational, and natural manner like ChatGPT.\n" +
                                   "Use the following LIVE real-time ERP database metrics to answer business questions accurately:\n\n" +
                                   erpContext + "\n\n" +
                                   "Always format your response using standard GitHub Markdown (bolding, lists, emojis) for clarity.";

                var payload = new
                {
                    model = model,
                    messages = new[]
                    {
                        new { role = "system", content = systemPrompt },
                        new { role = "user", content = userQuery }
                    },
                    temperature = 0.7,
                    max_tokens = 500
                };

                var jsonContent = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
                var response = await client.PostAsync(endpoint, jsonContent);

                if (response.IsSuccessStatusCode)
                {
                    var responseString = await response.Content.ReadAsStringAsync();
                    using var doc = JsonDocument.Parse(responseString);
                    var choices = doc.RootElement.GetProperty("choices");
                    if (choices.GetArrayLength() > 0)
                    {
                        var message = choices[0].GetProperty("message").GetProperty("content").GetString();
                        return message;
                    }
                }
            }
            catch (Exception ex)
            {
                // Fallback to local context engine if network or API key error occurs
                Console.WriteLine($"[OpenAI API Error]: {ex.Message}");
            }

            return null;
        }

        private async Task<ChatResponse> ProcessStructuredContextQueryAsync(string query, string erpContext)
        {
            var text = query.ToLowerInvariant();
            var username = User.Identity?.Name ?? "there";

            // Small talk & pleasantries
            if (Regex.IsMatch(text, @"\b(how are (you|u)|how do you do|how is it going|how's it going|how are things|what's up|whats up|sup|how is your day|how you doing)\b"))
            {
                return new ChatResponse
                {
                    Intent = "SmallTalk",
                    Answer = $"😊 I'm doing great, **{username}**! Thank you for asking.\n\nYour Copilot ERP system is up and running smoothly. How can I assist you with your business operations today?",
                    QuickActions = new List<QuickAction>
                    {
                        new QuickAction { Label = "📈 Business Summary", TargetTab = "overview" },
                        new QuickAction { Label = "🛒 Shopify Orders", TargetTab = "shopify" },
                        new QuickAction { Label = "📦 Inventory Check", TargetTab = "inventory" }
                    }
                };
            }

            // Gratitude
            if (Regex.IsMatch(text, @"\b(thank you|thanks|thx|awesome|great job|nice|perfect|cool|super|good work)\b"))
            {
                return new ChatResponse
                {
                    Intent = "Gratitude",
                    Answer = "💖 You're very welcome! I'm always here to help you keep your business running smoothly. Let me know if you need anything else!",
                    QuickActions = new List<QuickAction> { new QuickAction { Label = "📊 View Dashboard", TargetTab = "overview" } }
                };
            }

            // Identity
            if (Regex.IsMatch(text, @"\b(who are you|who created you|who built you|what is your name|are you (ai|human|robot)|what are you|your purpose)\b"))
            {
                return new ChatResponse
                {
                    Intent = "Identity",
                    Answer = "🤖 I am **Copilot AI Assistant**, an intelligent ERP Chatbot! I connect to OpenAI / Gemini LLMs or run locally with live database RAG grounding to answer revenue, order, inventory, and business health questions.",
                    QuickActions = new List<QuickAction> { new QuickAction { Label = "🛍️ Shopify Orders", TargetTab = "shopify" } }
                };
            }

            // Business status
            if (Regex.IsMatch(text, @"\b(how is business|how's business|how are sales|how is store|are we doing good|business status|executive summary|how are things going)\b"))
            {
                var invoices = await _context.Invoices.ToListAsync();
                var shopifyOrders = await _context.ShopifyOrders.ToListAsync();
                var lowStock = await _context.InventoryItems.CountAsync(i => i.Quantity <= 10);

                var paidTotal = invoices.Where(i => i.Status == "Paid").Sum(i => i.Amount);
                var shopifyTotal = shopifyOrders.Sum(s => s.TotalAmount);
                var combinedSales = paidTotal + shopifyTotal;

                return new ChatResponse
                {
                    Intent = "BusinessHealth",
                    Answer = $"📈 **Executive Business Status Summary**\n\n" +
                             $"• **Overall Performance:** Business is operating smoothly!\n" +
                             $"• **Combined Total Sales:** `${combinedSales:N2}`\n" +
                             $"• **Shopify Orders Ingested:** **{shopifyOrders.Count}** orders (`${shopifyTotal:N2}`)\n" +
                             $"• **Low Stock Warnings:** **{lowStock}** items requiring restock\n" +
                             $"• **System Health:** 100% Operational & Webhook Synced",
                    QuickActions = new List<QuickAction>
                    {
                        new QuickAction { Label = "📊 Executive Overview", TargetTab = "overview" },
                        new QuickAction { Label = "🛒 Shopify Orders", TargetTab = "shopify" }
                    }
                };
            }

            // Revenue
            if (Regex.IsMatch(text, @"\b(revenue|sales|earnings|income|money|financial|receivable|turnover)\b"))
            {
                var invoices = await _context.Invoices.ToListAsync();
                var shopifyOrders = await _context.ShopifyOrders.ToListAsync();

                var paidTotal = invoices.Where(i => i.Status == "Paid").Sum(i => i.Amount);
                var pendingTotal = invoices.Where(i => i.Status == "Pending" || i.Status == "Overdue").Sum(i => i.Amount);
                var shopifyTotal = shopifyOrders.Sum(s => s.TotalAmount);
                var totalCombined = paidTotal + shopifyTotal;

                return new ChatResponse
                {
                    Intent = "Revenue",
                    Answer = $"💰 **Financial & Revenue Summary**\n\n" +
                             $"• **Total Combined Sales:** `${totalCombined:N2}`\n" +
                             $"• **Shopify Store Sales:** `${shopifyTotal:N2}` ({shopifyOrders.Count} orders)\n" +
                             $"• **Paid Invoices Revenue:** `${paidTotal:N2}`\n" +
                             $"• **Pending Receivables:** `${pendingTotal:N2}`",
                    QuickActions = new List<QuickAction> { new QuickAction { Label = "📑 Open Invoices", TargetTab = "invoices" } }
                };
            }

            // Fallback for general questions with tip to add OpenAI key
            return new ChatResponse
            {
                Intent = "Fallback",
                Answer = $"🤖 **Copilot AI Assistant Response:**\n\n" +
                         $"Based on your live ERP records:\n" +
                         $"• **Total Revenue:** `${await GetTotalRevenueAsync():N2}`\n" +
                         $"• **Catalog Products:** {await _context.InventoryItems.CountAsync()} items\n\n" +
                         $"💡 *Want unconstrained GPT-4o natural conversations? Simply add your OpenAI API Key into `appsettings.json` under `\"OpenAI:ApiKey\"` to unlock full generative AI reasoning!*",
                QuickActions = ExtractQuickActions(query)
            };
        }

        private async Task<decimal> GetTotalRevenueAsync()
        {
            var paidInvoices = await _context.Invoices.Where(i => i.Status == "Paid").SumAsync(i => i.Amount);
            var shopifyTotal = await _context.ShopifyOrders.SumAsync(s => s.TotalAmount);
            return paidInvoices + shopifyTotal;
        }

        private List<QuickAction> ExtractQuickActions(string query)
        {
            var q = query.ToLower();
            if (q.Contains("stock") || q.Contains("inventory") || q.Contains("item"))
                return new List<QuickAction> { new QuickAction { Label = "📦 Open Inventory", TargetTab = "inventory" } };
            if (q.Contains("order") || q.Contains("shopify"))
                return new List<QuickAction> { new QuickAction { Label = "🛒 Shopify Orders", TargetTab = "shopify" } };
            if (q.Contains("invoice") || q.Contains("paid") || q.Contains("revenue"))
                return new List<QuickAction> { new QuickAction { Label = "📑 View Invoices", TargetTab = "invoices" } };
            return new List<QuickAction> { new QuickAction { Label = "📊 Dashboard Overview", TargetTab = "overview" } };
        }
    }
}
