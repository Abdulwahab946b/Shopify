using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Copilot.Data;
using Copilot.Models;
using System;
using System.Linq;
using System.Collections.Generic;
using Microsoft.Extensions.Configuration;

namespace Copilot.Controllers
{
    [Authorize]
    public class DashboardController : Controller
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public DashboardController(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        // GET: /Dashboard
        public async Task<IActionResult> Index()
        {
            var username = User.Identity?.Name ?? "Guest";
            
            // Get claims
            var email = User.FindFirst(ClaimTypes.Email)?.Value ?? "No email claim found";
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "N/A";

            ViewBag.Username = username;
            ViewBag.Email = email;
            ViewBag.UserId = userId;

            // Check how user signed in (e.g. google vs local)
            var currentUser = await _context.Users.FirstOrDefaultAsync(u => u.Id.ToString() == userId);
            var isGoogleUser = currentUser?.PasswordHash != null && currentUser.PasswordHash.StartsWith("GOOGLE_EXTERNAL_LOGIN_");
            ViewBag.AuthMethod = isGoogleUser ? "Google OAuth 2.0" : "Local Password Auth";

            // Fetch registered users
            var users = await _context.Users
                .OrderByDescending(u => u.Id)
                .Select(u => new UserDto
                {
                    Id = u.Id,
                    Username = u.Username,
                    Email = u.Email,
                    CreatedAt = u.CreatedAt
                })
                .ToListAsync();

            ViewBag.UsersList = users;

            // Fetch ERP module lists
            var invoices = await _context.Invoices.OrderByDescending(i => i.CreatedDate).ToListAsync();
            var inventory = await _context.InventoryItems.OrderBy(ii => ii.SKU).ToListAsync();
            var purchaseOrders = await _context.PurchaseOrders.OrderByDescending(po => po.OrderDate).ToListAsync();
            var auditLogs = await _context.AuditLogs.OrderByDescending(al => al.Timestamp).Take(20).ToListAsync();
            var shopifyOrders = await _context.ShopifyOrders
                .Include(so => so.OrderItems)
                .OrderByDescending(so => so.CreatedDate)
                .ToListAsync();

            ViewBag.Invoices = invoices;
            ViewBag.Inventory = inventory;
            ViewBag.PurchaseOrders = purchaseOrders;
            ViewBag.AuditLogs = auditLogs;
            ViewBag.ShopifyOrders = shopifyOrders;

            // Calculate KPIs
            var totalRevenue = invoices.Where(i => i.Status == "Paid").Sum(i => i.Amount);
            var pendingRevenue = invoices.Where(i => i.Status == "Pending").Sum(i => i.Amount);
            var activeOrdersCount = purchaseOrders.Count(po => po.Status != "Received");
            var availableInventoryCount = inventory.Sum(ii => ii.Quantity);
            
            decimal expenseRatio = 0;
            var totalPOExpenses = purchaseOrders.Sum(po => po.TotalCost);
            var totalSalesInvoiceValue = invoices.Sum(i => i.Amount);
            if (totalSalesInvoiceValue > 0)
            {
                expenseRatio = Math.Round((totalPOExpenses / totalSalesInvoiceValue) * 100, 1);
            }

            ViewBag.TotalRevenue = totalRevenue;
            ViewBag.PendingRevenue = pendingRevenue;
            ViewBag.ActiveOrdersCount = activeOrdersCount;
            ViewBag.ExpenseRatio = expenseRatio;
            ViewBag.AvailableInventoryCount = availableInventoryCount;

            // Shopify Specific KPIs
            ViewBag.ShopifyTotalSales = shopifyOrders.Sum(so => so.TotalAmount);
            ViewBag.ShopifyOrderCount = shopifyOrders.Count;
            ViewBag.ShopifyUnfulfilledCount = shopifyOrders.Count(so => so.FulfillmentStatus == "Unfulfilled");

            return View();
        }

        // POST: /Dashboard/CreateInvoice
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CreateInvoice(string customerName, decimal amount, string status, string description)
        {
            if (string.IsNullOrWhiteSpace(customerName) || amount <= 0 || string.IsNullOrWhiteSpace(status))
            {
                return Json(new { success = false, message = "Please fill in all required fields. Amount must be greater than zero." });
            }

            var username = User.Identity?.Name ?? "Guest";

            // Determine next invoice number
            var year = DateTime.UtcNow.Year;
            var invoiceCount = await _context.Invoices.CountAsync() + 1;
            var invoiceNumber = $"INV-{year}-{invoiceCount:D3}";

            var invoice = new Invoice
            {
                InvoiceNumber = invoiceNumber,
                CustomerName = customerName.Trim(),
                Amount = amount,
                Status = status,
                Description = description?.Trim() ?? string.Empty,
                CreatedDate = DateTime.UtcNow
            };

            var audit = new AuditLog
            {
                Username = username,
                Action = "Create Invoice",
                Details = $"Created invoice {invoiceNumber} for {invoice.CustomerName} ($ {amount}) with status '{status}'",
                Timestamp = DateTime.UtcNow
            };

            try
            {
                _context.Invoices.Add(invoice);
                _context.AuditLogs.Add(audit);
                await _context.SaveChangesAsync();
                return Json(new { success = true, message = $"Invoice {invoiceNumber} created successfully!" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error saving invoice: {ex.Message}" });
            }
        }

        // POST: /Dashboard/UpdateInvoiceStatus
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> UpdateInvoiceStatus(int id, string status)
        {
            var invoice = await _context.Invoices.FindAsync(id);
            if (invoice == null)
            {
                return Json(new { success = false, message = "Invoice not found." });
            }

            var username = User.Identity?.Name ?? "Guest";
            var oldStatus = invoice.Status;
            invoice.Status = status;

            var audit = new AuditLog
            {
                Username = username,
                Action = "Update Invoice Status",
                Details = $"Updated invoice {invoice.InvoiceNumber} status from '{oldStatus}' to '{status}'",
                Timestamp = DateTime.UtcNow
            };

            try
            {
                _context.AuditLogs.Add(audit);
                await _context.SaveChangesAsync();
                return Json(new { success = true, message = $"Invoice {invoice.InvoiceNumber} status updated to {status}!" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error updating status: {ex.Message}" });
            }
        }

        // POST: /Dashboard/SaveInventoryItem
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> SaveInventoryItem(int? id, string sku, string name, string category, int quantity, decimal unitPrice)
        {
            if (string.IsNullOrWhiteSpace(sku) || string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(category) || quantity < 0 || unitPrice <= 0)
            {
                return Json(new { success = false, message = "Please fill in all fields with valid values." });
            }

            var username = User.Identity?.Name ?? "Guest";
            sku = sku.Trim().ToUpper();

            if (id == null)
            {
                // Check if SKU is taken
                if (await _context.InventoryItems.AnyAsync(ii => ii.SKU == sku))
                {
                    return Json(new { success = false, message = $"SKU '{sku}' already exists in inventory." });
                }

                var item = new InventoryItem
                {
                    SKU = sku,
                    Name = name.Trim(),
                    Category = category.Trim(),
                    Quantity = quantity,
                    UnitPrice = unitPrice,
                    LastUpdated = DateTime.UtcNow
                };

                var audit = new AuditLog
                {
                    Username = username,
                    Action = "Add Inventory Item",
                    Details = $"Added inventory SKU {sku} ({item.Name}), qty: {quantity}, unit price: $ {unitPrice}",
                    Timestamp = DateTime.UtcNow
                };

                try
                {
                    _context.InventoryItems.Add(item);
                    _context.AuditLogs.Add(audit);
                    await _context.SaveChangesAsync();
                    return Json(new { success = true, message = $"Product {item.Name} added to catalog!" });
                }
                catch (Exception ex)
                {
                    return Json(new { success = false, message = $"Error adding product: {ex.Message}" });
                }
            }
            else
            {
                var item = await _context.InventoryItems.FindAsync(id);
                if (item == null)
                {
                    return Json(new { success = false, message = "Product not found." });
                }

                var oldQty = item.Quantity;
                item.Name = name.Trim();
                item.Category = category.Trim();
                item.Quantity = quantity;
                item.UnitPrice = unitPrice;
                item.LastUpdated = DateTime.UtcNow;

                var audit = new AuditLog
                {
                    Username = username,
                    Action = "Update Inventory Item",
                    Details = $"Updated inventory SKU {item.SKU} ({item.Name}). Qty: {oldQty} -> {quantity}, unit price: $ {unitPrice}",
                    Timestamp = DateTime.UtcNow
                };

                try
                {
                    _context.AuditLogs.Add(audit);
                    await _context.SaveChangesAsync();
                    return Json(new { success = true, message = $"Product {item.Name} updated successfully!" });
                }
                catch (Exception ex)
                {
                    return Json(new { success = false, message = $"Error updating product: {ex.Message}" });
                }
            }
        }

        // POST: /Dashboard/CreatePurchaseOrder
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CreatePurchaseOrder(string supplierName, string itemName, int quantity, decimal unitPrice)
        {
            if (string.IsNullOrWhiteSpace(supplierName) || string.IsNullOrWhiteSpace(itemName) || quantity <= 0 || unitPrice <= 0)
            {
                return Json(new { success = false, message = "Please fill in all fields with values greater than zero." });
            }

            var username = User.Identity?.Name ?? "Guest";
            var year = DateTime.UtcNow.Year;
            var poCount = await _context.PurchaseOrders.CountAsync() + 1;
            var poNumber = $"PO-{year}-{poCount:D3}";
            var totalCost = quantity * unitPrice;

            var po = new PurchaseOrder
            {
                PONumber = poNumber,
                SupplierName = supplierName.Trim(),
                ItemName = itemName.Trim(),
                Quantity = quantity,
                UnitPrice = unitPrice,
                TotalCost = totalCost,
                Status = "Pending",
                OrderDate = DateTime.UtcNow
            };

            var audit = new AuditLog
            {
                Username = username,
                Action = "Create Purchase Order",
                Details = $"Created purchase order {poNumber} to {po.SupplierName} for {quantity}x {itemName} ($ {totalCost})",
                Timestamp = DateTime.UtcNow
            };

            try
            {
                _context.PurchaseOrders.Add(po);
                _context.AuditLogs.Add(audit);
                await _context.SaveChangesAsync();
                return Json(new { success = true, message = $"Purchase Order {poNumber} created successfully!" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error creating purchase order: {ex.Message}" });
            }
        }

        // POST: /Dashboard/CreateShopifyOrder
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CreateShopifyOrder(
            string shopifyDomain, string customerName, string customerEmail, string customerPhone,
            string shippingAddress, string city, string province, string country, string zipCode,
            decimal subtotal, decimal shippingCost, decimal taxCost, decimal totalAmount,
            string financialStatus, string fulfillmentStatus, string orderNotes, string itemsJson)
        {
            if (string.IsNullOrWhiteSpace(shopifyDomain) || string.IsNullOrWhiteSpace(customerName) ||
                string.IsNullOrWhiteSpace(customerEmail) || string.IsNullOrWhiteSpace(shippingAddress) ||
                string.IsNullOrWhiteSpace(city) || string.IsNullOrWhiteSpace(province) ||
                string.IsNullOrWhiteSpace(country) || string.IsNullOrWhiteSpace(zipCode) ||
                string.IsNullOrWhiteSpace(itemsJson))
            {
                return Json(new { success = false, message = "Please fill in all required fields." });
            }

            var username = User.Identity?.Name ?? "Guest";

            // Generate next order number for this shop
            shopifyDomain = shopifyDomain.Trim().ToLower();
            var existingOrdersCount = await _context.ShopifyOrders
                .CountAsync(so => so.ShopifyDomain == shopifyDomain);
            var orderNumber = $"#{1001 + existingOrdersCount}";

            var order = new ShopifyOrder
            {
                OrderNumber = orderNumber,
                ShopifyDomain = shopifyDomain,
                CustomerName = customerName.Trim(),
                CustomerEmail = customerEmail.Trim(),
                CustomerPhone = customerPhone?.Trim() ?? string.Empty,
                ShippingAddress = shippingAddress.Trim(),
                City = city.Trim(),
                Province = province.Trim(),
                Country = country.Trim(),
                ZipCode = zipCode.Trim(),
                Subtotal = subtotal,
                ShippingCost = shippingCost,
                TaxCost = taxCost,
                TotalAmount = totalAmount,
                FinancialStatus = financialStatus,
                FulfillmentStatus = fulfillmentStatus,
                OrderNotes = orderNotes?.Trim() ?? string.Empty,
                CreatedDate = DateTime.UtcNow
            };

            List<ShopifyOrderItemDto>? items = null;
            try
            {
                items = System.Text.Json.JsonSerializer.Deserialize<List<ShopifyOrderItemDto>>(itemsJson, new System.Text.Json.JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
            }
            catch
            {
                return Json(new { success = false, message = "Invalid items format." });
            }

            if (items == null || !items.Any())
            {
                return Json(new { success = false, message = "Order must have at least one item." });
            }

            // Verify and add items
            foreach (var item in items)
            {
                if (string.IsNullOrWhiteSpace(item.SKU) || string.IsNullOrWhiteSpace(item.ItemName) || item.Quantity <= 0 || item.UnitPrice <= 0)
                {
                    return Json(new { success = false, message = "Item details are invalid. Quantity and Price must be greater than zero." });
                }

                var orderItem = new ShopifyOrderItem
                {
                    SKU = item.SKU.Trim().ToUpper(),
                    ItemName = item.ItemName.Trim(),
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice
                };

                order.OrderItems.Add(orderItem);

                // If fulfillment status is Fulfilled, decrement stock from ERP inventory
                if (fulfillmentStatus == "Fulfilled")
                {
                    var inventoryItem = await _context.InventoryItems.FirstOrDefaultAsync(ii => ii.SKU == orderItem.SKU);
                    if (inventoryItem != null)
                     {
                         inventoryItem.Quantity = Math.Max(0, inventoryItem.Quantity - orderItem.Quantity);
                         inventoryItem.LastUpdated = DateTime.UtcNow;
                     }
                }
            }

            var audit = new AuditLog
            {
                Username = username,
                Action = "Create Shopify Order",
                Details = $"Created Shopify order {orderNumber} for {order.CustomerName} on {shopifyDomain} ($ {totalAmount}). Fulfillment: '{fulfillmentStatus}'",
                Timestamp = DateTime.UtcNow
            };

            try
            {
                _context.ShopifyOrders.Add(order);
                _context.AuditLogs.Add(audit);
                await _context.SaveChangesAsync();
                return Json(new { success = true, message = $"Shopify Order {orderNumber} created successfully!" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error saving order: {ex.Message}" });
            }
        }

        // POST: /Dashboard/UpdateShopifyOrderStatus
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> UpdateShopifyOrderStatus(int id, string financialStatus, string fulfillmentStatus)
        {
            var order = await _context.ShopifyOrders
                .Include(so => so.OrderItems)
                .FirstOrDefaultAsync(so => so.Id == id);
                
            if (order == null)
            {
                return Json(new { success = false, message = "Shopify Order not found." });
            }

            var username = User.Identity?.Name ?? "Guest";
            var oldFinancial = order.FinancialStatus;
            var oldFulfillment = order.FulfillmentStatus;

            order.FinancialStatus = financialStatus;
            
            // Handle transition to Fulfilled: decrement stock if it wasn't fulfilled before
            if (fulfillmentStatus == "Fulfilled" && oldFulfillment != "Fulfilled")
            {
                foreach (var item in order.OrderItems)
                {
                    var inventoryItem = await _context.InventoryItems.FirstOrDefaultAsync(ii => ii.SKU == item.SKU);
                    if (inventoryItem != null)
                    {
                        inventoryItem.Quantity = Math.Max(0, inventoryItem.Quantity - item.Quantity);
                        inventoryItem.LastUpdated = DateTime.UtcNow;
                    }
                }
            }
            // Handle transition from Fulfilled to Unfulfilled/Restocked: increment stock back
            else if (fulfillmentStatus != "Fulfilled" && oldFulfillment == "Fulfilled")
            {
                foreach (var item in order.OrderItems)
                {
                    var inventoryItem = await _context.InventoryItems.FirstOrDefaultAsync(ii => ii.SKU == item.SKU);
                    if (inventoryItem != null)
                    {
                        inventoryItem.Quantity += item.Quantity;
                        inventoryItem.LastUpdated = DateTime.UtcNow;
                    }
                }
            }

            order.FulfillmentStatus = fulfillmentStatus;

            var audit = new AuditLog
            {
                Username = username,
                Action = "Update Shopify Order Status",
                Details = $"Updated Shopify Order {order.OrderNumber} ({order.ShopifyDomain}): Payment '{oldFinancial}' -> '{financialStatus}', Fulfillment '{oldFulfillment}' -> '{fulfillmentStatus}'",
                Timestamp = DateTime.UtcNow
            };

            try
            {
                _context.AuditLogs.Add(audit);
                await _context.SaveChangesAsync();
                return Json(new { success = true, message = $"Shopify Order {order.OrderNumber} status updated!" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error updating status: {ex.Message}" });
            }
        }

        // POST: /Dashboard/DeleteShopifyOrder
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteShopifyOrder(int id)
        {
            var order = await _context.ShopifyOrders
                .Include(so => so.OrderItems)
                .FirstOrDefaultAsync(so => so.Id == id);

            if (order == null)
            {
                return Json(new { success = false, message = "Shopify Order not found." });
            }

            var username = User.Identity?.Name ?? "Guest";
            var orderNum = order.OrderNumber;

            try
            {
                _context.ShopifyOrderItems.RemoveRange(order.OrderItems);
                _context.ShopifyOrders.Remove(order);
                _context.AuditLogs.Add(new AuditLog
                {
                    Username = username,
                    Action = "Delete Shopify Order",
                    Details = $"Deleted Shopify order {orderNum}",
                    Timestamp = DateTime.UtcNow
                });
                await _context.SaveChangesAsync();
                return Json(new { success = true, message = $"Shopify Order {orderNum} deleted successfully!" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error deleting order: {ex.Message}" });
            }
        }

        // POST: /Dashboard/ClearAllShopifyOrders
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ClearAllShopifyOrders()
        {
            var username = User.Identity?.Name ?? "Guest";
            try
            {
                await _context.ShopifyOrderItems.ExecuteDeleteAsync();
                await _context.ShopifyOrders.ExecuteDeleteAsync();

                _context.AuditLogs.Add(new AuditLog
                {
                    Username = username,
                    Action = "Delete All Shopify Orders",
                    Details = "Deleted all Shopify orders and line items from database.",
                    Timestamp = DateTime.UtcNow
                });
                await _context.SaveChangesAsync();
                return Json(new { success = true, message = "All Shopify orders have been deleted successfully!" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error clearing orders: {ex.Message}" });
            }
        }

        // POST: /Dashboard/DeleteAuditLog
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteAuditLog(int id)
        {
            var audit = await _context.AuditLogs.FindAsync(id);
            if (audit == null)
            {
                return Json(new { success = false, message = "Audit log not found." });
            }

            try
            {
                _context.AuditLogs.Remove(audit);
                await _context.SaveChangesAsync();
                return Json(new { success = true, message = "Audit log entry deleted successfully!" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error deleting audit log: {ex.Message}" });
            }
        }

        // POST: /Dashboard/ClearShopifyAuditLogs
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ClearShopifyAuditLogs()
        {
            try
            {
                var count = await _context.AuditLogs
                    .Where(a => a.Username == "Shopify Webhook" || a.Action.Contains("Shopify") || a.Details.Contains("Shopify"))
                    .ExecuteDeleteAsync();

                return Json(new { success = true, message = $"Deleted {count} Shopify audit logs successfully!" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error deleting Shopify audit logs: {ex.Message}" });
            }
        }

        // POST: /Dashboard/ClearAllAuditLogs
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ClearAllAuditLogs()
        {
            try
            {
                await _context.AuditLogs.ExecuteDeleteAsync();
                return Json(new { success = true, message = "All system audit logs deleted successfully!" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error deleting audit logs: {ex.Message}" });
            }
        }

        // POST: /api/shopify/webhook/order-created
        [HttpPost]
        [AllowAnonymous]
        [IgnoreAntiforgeryToken]
        [Route("api/shopify/webhook/order-created")]
        public async Task<IActionResult> ShopifyOrderCreatedWebhook()
        {
            // Read raw body bytes directly to ensure exact byte-for-byte HMAC verification
            using var ms = new System.IO.MemoryStream();
            await Request.Body.CopyToAsync(ms);
            var bodyBytes = ms.ToArray();
            var json = System.Text.Encoding.UTF8.GetString(bodyBytes);

            var hmacHeader = Request.Headers["X-Shopify-Hmac-Sha256"].FirstOrDefault() ?? "";
            var shopDomain = Request.Headers["X-Shopify-Shop-Domain"].FirstOrDefault() ?? "";

            if (string.IsNullOrEmpty(shopDomain))
            {
                shopDomain = "unknown-shop.myshopify.com";
            }

            // --- IMMEDIATE RAW LOGGING ---
            var rawAudit = new AuditLog
            {
                Username = "Shopify Webhook",
                Action = "Webhook Received (RAW)",
                Details = $"Received request from {shopDomain}. HMAC Header: {hmacHeader}. Body Length: {json.Length}",
                Timestamp = DateTime.UtcNow
            };
            _context.AuditLogs.Add(rawAudit);
            await _context.SaveChangesAsync();
            // -----------------------------

            // Verify webhook payload signature against WebhookSecret and AppSecret
            var secret = _configuration["Shopify:WebhookSecret"];
            var appSecret = _configuration["Shopify:AppSecret"];
            bool isVerified = false;
            
            if (!string.IsNullOrEmpty(hmacHeader))
            {
                if (!string.IsNullOrEmpty(secret) && VerifyShopifyWebhookSignatureBytes(bodyBytes, hmacHeader, secret))
                {
                    isVerified = true;
                }
                else if (!string.IsNullOrEmpty(appSecret) && VerifyShopifyWebhookSignatureBytes(bodyBytes, hmacHeader, appSecret))
                {
                    isVerified = true;
                }
            }

            // If secrets are configured but verification failed, log failure and reject
            if ((!string.IsNullOrEmpty(secret) || !string.IsNullOrEmpty(appSecret)) && !isVerified && !string.IsNullOrEmpty(hmacHeader))
            {
                var calc = GetShopifyHmacBytes(bodyBytes, secret ?? "");
                var failedAudit = new AuditLog
                {
                    Username = "Shopify Webhook",
                    Action = "Webhook Auth Failed",
                    Details = $"Webhook from {shopDomain} failed HMAC check. Recv: '{hmacHeader}' vs Calc: '{calc}'",
                    Timestamp = DateTime.UtcNow
                };
                _context.AuditLogs.Add(failedAudit);
                await _context.SaveChangesAsync();
                return Unauthorized("Signature verification failed.");
            }

            try
            {
                using var document = System.Text.Json.JsonDocument.Parse(json);
                var root = document.RootElement;

                // Parse order details
                string orderNumber;
                if (root.TryGetProperty("name", out var nameProp) && nameProp.ValueKind == System.Text.Json.JsonValueKind.String)
                {
                    orderNumber = nameProp.GetString() ?? "";
                }
                else if (root.TryGetProperty("order_number", out var numProp))
                {
                    orderNumber = $"#{numProp.GetInt64()}";
                }
                else
                {
                    orderNumber = $"#SW-{DateTime.UtcNow.Ticks % 1000000}";
                }

                var email = root.TryGetProperty("email", out var emProp) ? emProp.GetString() ?? "" : "";
                var phone = root.TryGetProperty("phone", out var phProp) ? phProp.GetString() ?? "" : "";
                
                DateTime createdDate = DateTime.UtcNow;
                if (root.TryGetProperty("created_at", out var dateProp) && dateProp.ValueKind == System.Text.Json.JsonValueKind.String)
                {
                    if (DateTime.TryParse(dateProp.GetString(), out var parsedDate))
                    {
                        createdDate = parsedDate.ToUniversalTime();
                    }
                }

                decimal subtotal = 0;
                if (root.TryGetProperty("subtotal_price", out var subProp))
                {
                    if (subProp.ValueKind == System.Text.Json.JsonValueKind.String)
                    {
                        decimal.TryParse(subProp.GetString(), out subtotal);
                    }
                    else if (subProp.ValueKind == System.Text.Json.JsonValueKind.Number)
                    {
                        subtotal = subProp.GetDecimal();
                    }
                }

                decimal taxCost = 0;
                if (root.TryGetProperty("total_tax", out var taxProp))
                {
                    if (taxProp.ValueKind == System.Text.Json.JsonValueKind.String)
                    {
                        decimal.TryParse(taxProp.GetString(), out taxCost);
                    }
                    else if (taxProp.ValueKind == System.Text.Json.JsonValueKind.Number)
                    {
                        taxCost = taxProp.GetDecimal();
                    }
                }

                decimal totalAmount = 0;
                if (root.TryGetProperty("total_price", out var totProp))
                {
                    if (totProp.ValueKind == System.Text.Json.JsonValueKind.String)
                    {
                        decimal.TryParse(totProp.GetString(), out totalAmount);
                    }
                    else if (totProp.ValueKind == System.Text.Json.JsonValueKind.Number)
                    {
                        totalAmount = totProp.GetDecimal();
                    }
                }

                // Shipping cost from shipping_lines
                decimal shippingCost = 0;
                if (root.TryGetProperty("shipping_lines", out var shippingLines) && shippingLines.ValueKind == System.Text.Json.JsonValueKind.Array)
                {
                    foreach (var line in shippingLines.EnumerateArray())
                    {
                        if (line.TryGetProperty("price", out var priceElement))
                        {
                            decimal linePrice = 0;
                            if (priceElement.ValueKind == System.Text.Json.JsonValueKind.String)
                            {
                                decimal.TryParse(priceElement.GetString(), out linePrice);
                            }
                            else if (priceElement.ValueKind == System.Text.Json.JsonValueKind.Number)
                            {
                                linePrice = priceElement.GetDecimal();
                            }
                            shippingCost += linePrice;
                        }
                    }
                }

                // Customer Info
                string customerName = "Unknown Customer";
                if (root.TryGetProperty("customer", out var customerElement) && customerElement.ValueKind == System.Text.Json.JsonValueKind.Object)
                {
                    var firstName = customerElement.TryGetProperty("first_name", out var fn) ? fn.GetString() ?? "" : "";
                    var lastName = customerElement.TryGetProperty("last_name", out var ln) ? ln.GetString() ?? "" : "";
                    customerName = $"{firstName} {lastName}".Trim();
                    if (string.IsNullOrEmpty(customerName)) customerName = "Unknown Customer";
                    
                    if (string.IsNullOrEmpty(email))
                    {
                        email = customerElement.TryGetProperty("email", out var em) ? em.GetString() ?? "" : "";
                    }
                    if (string.IsNullOrEmpty(phone))
                    {
                        phone = customerElement.TryGetProperty("phone", out var ph) ? ph.GetString() ?? "" : "";
                    }
                }

                // Shipping Address Info
                string shippingAddress = "No Shipping Address Provided";
                string city = "";
                string province = "";
                string country = "";
                string zipCode = "";
                if (root.TryGetProperty("shipping_address", out var addrElement) && addrElement.ValueKind == System.Text.Json.JsonValueKind.Object)
                {
                    shippingAddress = addrElement.TryGetProperty("address1", out var ad1) ? ad1.GetString() ?? "" : "";
                    var address2 = addrElement.TryGetProperty("address2", out var ad2) ? ad2.GetString() ?? "" : "";
                    if (!string.IsNullOrEmpty(address2)) shippingAddress += $", {address2}";
                    
                    city = addrElement.TryGetProperty("city", out var ci) ? ci.GetString() ?? "" : "";
                    province = addrElement.TryGetProperty("province", out var pr) ? pr.GetString() ?? "" : "";
                    country = addrElement.TryGetProperty("country", out var co) ? co.GetString() ?? "" : "";
                    zipCode = addrElement.TryGetProperty("zip", out var zi) ? zi.GetString() ?? "" : "";
                }

                // Financial & Fulfillment Status mapping
                var rawFinancial = root.TryGetProperty("financial_status", out var fin) ? fin.GetString() ?? "" : "";
                var financialStatus = rawFinancial.ToLower() == "paid" ? "Paid" : "Pending";

                var rawFulfillment = root.TryGetProperty("fulfillment_status", out var ful) ? ful.GetString() ?? "" : "";
                var fulfillmentStatus = rawFulfillment.ToLower() == "fulfilled" ? "Fulfilled" : "Unfulfilled";

                var orderNotes = root.TryGetProperty("note", out var nt) ? nt.GetString() ?? "" : "";

                // Check if order already exists to prevent duplicate ingestion
                var shopDomainLower = shopDomain.Trim().ToLower();
                var existingOrder = await _context.ShopifyOrders
                    .FirstOrDefaultAsync(so => so.OrderNumber == orderNumber && so.ShopifyDomain == shopDomainLower);

                if (existingOrder != null)
                {
                    var dupAudit = new AuditLog
                    {
                        Username = "Shopify Webhook",
                        Action = "Duplicate Webhook Received",
                        Details = $"Re-received Shopify order notification for {orderNumber} on {shopDomainLower} ($ {totalAmount}). Order already exists in ERP.",
                        Timestamp = DateTime.UtcNow
                    };
                    _context.AuditLogs.Add(dupAudit);
                    await _context.SaveChangesAsync();
                    return Ok(new { success = true, message = "Order already exists.", orderId = existingOrder.Id });
                }

                var order = new ShopifyOrder
                {
                    OrderNumber = orderNumber,
                    ShopifyDomain = shopDomainLower,
                    CustomerName = customerName,
                    CustomerEmail = email,
                    CustomerPhone = phone,
                    ShippingAddress = shippingAddress,
                    City = city,
                    Province = province,
                    Country = country,
                    ZipCode = zipCode,
                    Subtotal = subtotal,
                    ShippingCost = shippingCost,
                    TaxCost = taxCost,
                    TotalAmount = totalAmount,
                    FinancialStatus = financialStatus,
                    FulfillmentStatus = fulfillmentStatus,
                    OrderNotes = orderNotes,
                    CreatedDate = createdDate
                };

                // Parse line items
                if (root.TryGetProperty("line_items", out var lineItems) && lineItems.ValueKind == System.Text.Json.JsonValueKind.Array)
                {
                    foreach (var item in lineItems.EnumerateArray())
                    {
                        var sku = item.TryGetProperty("sku", out var sk) ? sk.GetString() ?? "" : "";
                        var itemName = item.TryGetProperty("title", out var ti) ? ti.GetString() ?? "Product Item" : "Product Item";
                        var qty = item.TryGetProperty("quantity", out var qt) ? qt.GetInt32() : 1;
                        
                        decimal unitPrice = 0;
                        if (item.TryGetProperty("price", out var prcElement))
                        {
                            if (prcElement.ValueKind == System.Text.Json.JsonValueKind.String)
                            {
                                decimal.TryParse(prcElement.GetString(), out unitPrice);
                            }
                            else if (prcElement.ValueKind == System.Text.Json.JsonValueKind.Number)
                            {
                                unitPrice = prcElement.GetDecimal();
                            }
                        }

                        if (string.IsNullOrEmpty(sku))
                        {
                            sku = "NO-SKU";
                        }

                        var orderItem = new ShopifyOrderItem
                        {
                            SKU = sku.Trim().ToUpper(),
                            ItemName = itemName,
                            Quantity = qty,
                            UnitPrice = unitPrice
                        };

                        order.OrderItems.Add(orderItem);

                        // If fulfillment status is Fulfilled, decrement stock from ERP inventory
                        if (fulfillmentStatus == "Fulfilled")
                        {
                            var inventoryItem = await _context.InventoryItems.FirstOrDefaultAsync(ii => ii.SKU == orderItem.SKU);
                            if (inventoryItem != null)
                            {
                                inventoryItem.Quantity = Math.Max(0, inventoryItem.Quantity - orderItem.Quantity);
                                inventoryItem.LastUpdated = DateTime.UtcNow;
                            }
                        }
                    }
                }

                _context.ShopifyOrders.Add(order);

                // Create Audit Log
                var verificationStatus = isVerified ? "verified HMAC signature" : "no secret configured (accepted)";
                var audit = new AuditLog
                {
                    Username = "Shopify Webhook",
                    Action = "Ingest Webhook Order",
                    Details = $"Ingested Shopify order {orderNumber} for {customerName} on {shopDomainLower} ($ {totalAmount}). Fulfillment: '{fulfillmentStatus}' ({verificationStatus}).",
                    Timestamp = DateTime.UtcNow
                };
                _context.AuditLogs.Add(audit);

                await _context.SaveChangesAsync();
                return Ok(new { success = true, message = $"Shopify Webhook Order {orderNumber} created successfully!", orderId = order.Id });
            }
            catch (Exception ex)
            {
                var errorAudit = new AuditLog
                {
                    Username = "Shopify Webhook",
                    Action = "Webhook Processing Failed",
                    Details = $"Failed to parse Shopify webhook from {shopDomain}: {ex.Message}",
                    Timestamp = DateTime.UtcNow
                };
                _context.AuditLogs.Add(errorAudit);
                await _context.SaveChangesAsync();
                return BadRequest($"Error parsing webhook: {ex.Message}");
            }
        }

        private string GetShopifyHmacBytes(byte[] bodyBytes, string secret)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(secret)) return "";
                var keyBytes = System.Text.Encoding.UTF8.GetBytes(secret.Trim());
                using var hmac = new System.Security.Cryptography.HMACSHA256(keyBytes);
                var hashBytes = hmac.ComputeHash(bodyBytes);
                return Convert.ToBase64String(hashBytes);
            }
            catch
            {
                return "";
            }
        }

        private bool VerifyShopifyWebhookSignatureBytes(byte[] bodyBytes, string hmacHeader, string secret)
        {
            var calculatedHmac = GetShopifyHmacBytes(bodyBytes, secret);
            return calculatedHmac.Equals(hmacHeader, StringComparison.Ordinal);
        }
    }

    public class ShopifyOrderItemDto
    {
        public string SKU { get; set; } = string.Empty;
        public string ItemName { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
    }

    public class UserDto
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
