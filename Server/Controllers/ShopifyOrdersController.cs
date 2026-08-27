using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Copilot.Data;
using Copilot.Models;

namespace Copilot.Controllers
{
    /// <summary>
    /// Beginner-Friendly API Controller for Shopify Orders & Webhooks.
    /// Endpoint Base: /api/shopify-orders
    /// </summary>
    [ApiController]
    [Route("api/shopify-orders")]
    public class ShopifyOrdersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ShopifyOrdersController(AppDbContext context)
        {
            _context = context;
        }

        // GET: /api/shopify-orders
        // Lists all ingested Shopify orders
        [HttpGet]
        public async Task<IActionResult> GetAllShopifyOrders()
        {
            var orders = await _context.ShopifyOrders
                .Include(o => o.OrderItems)
                .OrderByDescending(o => o.CreatedDate)
                .ToListAsync();

            return Ok(new { success = true, data = orders });
        }

        // POST: /api/shopify-orders
        // Ingests or creates a new Shopify order
        [HttpPost]
        public async Task<IActionResult> CreateShopifyOrder([FromBody] ShopifyOrderCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.CustomerName) || string.IsNullOrWhiteSpace(dto.CustomerEmail))
            {
                return BadRequest(new { success = false, message = "Customer name and email are required." });
            }

            var orderNum = dto.OrderNumber;
            if (string.IsNullOrWhiteSpace(orderNum))
            {
                orderNum = $"#SHPFY-{Random.Shared.Next(1000, 9999)}";
            }

            var order = new ShopifyOrder
            {
                OrderNumber = orderNum,
                ShopifyDomain = string.IsNullOrWhiteSpace(dto.ShopifyDomain) ? "my-shopify-store.myshopify.com" : dto.ShopifyDomain,
                CustomerName = dto.CustomerName.Trim(),
                CustomerEmail = dto.CustomerEmail.Trim(),
                ShippingAddress = dto.ShippingAddress?.Trim() ?? string.Empty,
                City = "San Jose",
                Province = "CA",
                Country = "US",
                ZipCode = "95134",
                TotalAmount = dto.TotalAmount,
                FinancialStatus = string.IsNullOrWhiteSpace(dto.PaymentStatus) ? "Paid" : dto.PaymentStatus,
                FulfillmentStatus = string.IsNullOrWhiteSpace(dto.FulfillmentStatus) ? "Unfulfilled" : dto.FulfillmentStatus,
                CreatedDate = DateTime.UtcNow
            };

            if (dto.OrderItems != null && dto.OrderItems.Count > 0)
            {
                foreach (var item in dto.OrderItems)
                {
                    order.OrderItems.Add(new ShopifyOrderItem
                    {
                        SKU = item.SKU ?? "SHPFY-ITEM",
                        ItemName = item.Title ?? "Product Item",
                        Quantity = item.Quantity > 0 ? item.Quantity : 1,
                        UnitPrice = item.Price
                    });
                }
            }

            _context.ShopifyOrders.Add(order);

            _context.AuditLogs.Add(new AuditLog
            {
                Username = "Shopify-Webhook",
                Action = "Shopify Order Created",
                Details = $"Ingested order {orderNum} for {order.CustomerName} (${order.TotalAmount})",
                Timestamp = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Shopify Order processed!", data = order });
        }

        // PUT: /api/shopify-orders/5/status
        // Updates fulfillment or payment status
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] ShopifyStatusDto dto)
        {
            var order = await _context.ShopifyOrders.FindAsync(id);
            if (order == null)
            {
                return NotFound(new { success = false, message = "Shopify Order not found." });
            }

            if (!string.IsNullOrWhiteSpace(dto.PaymentStatus))
            {
                order.FinancialStatus = dto.PaymentStatus;
            }

            if (!string.IsNullOrWhiteSpace(dto.FulfillmentStatus))
            {
                order.FulfillmentStatus = dto.FulfillmentStatus;
            }

            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Order status updated!" });
        }

        // DELETE: /api/shopify-orders/5
        // Deletes a single order
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteShopifyOrder(int id)
        {
            var order = await _context.ShopifyOrders.FindAsync(id);
            if (order == null)
            {
                return NotFound(new { success = false, message = "Order not found." });
            }

            _context.ShopifyOrders.Remove(order);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Order deleted." });
        }

        // DELETE: /api/shopify-orders
        // Clears all Shopify orders
        [HttpDelete]
        public async Task<IActionResult> ClearAllShopifyOrders()
        {
            var allItems = await _context.ShopifyOrderItems.ToListAsync();
            var allOrders = await _context.ShopifyOrders.ToListAsync();

            _context.ShopifyOrderItems.RemoveRange(allItems);
            _context.ShopifyOrders.RemoveRange(allOrders);

            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "All Shopify orders cleared." });
        }
    }

    public class ShopifyOrderCreateDto
    {
        public string? OrderNumber { get; set; }
        public string? ShopifyDomain { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerEmail { get; set; } = string.Empty;
        public string? ShippingAddress { get; set; }
        public decimal TotalAmount { get; set; }
        public string? PaymentStatus { get; set; }
        public string? FulfillmentStatus { get; set; }
        public List<ShopifyItemDto>? OrderItems { get; set; }
    }

    public class ShopifyItemDto
    {
        public string? SKU { get; set; }
        public string? Title { get; set; }
        public int Quantity { get; set; }
        public decimal Price { get; set; }
    }

    public class ShopifyStatusDto
    {
        public string? PaymentStatus { get; set; }
        public string? FulfillmentStatus { get; set; }
    }
}
