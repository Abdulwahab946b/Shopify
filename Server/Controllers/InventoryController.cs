using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Copilot.Data;
using Copilot.Models;

namespace Copilot.Controllers
{
    /// <summary>
    /// Beginner-Friendly API Controller for Catalog & Inventory Management.
    /// Endpoint Base: /api/inventory
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class InventoryController : ControllerBase
    {
        private readonly AppDbContext _context;

        public InventoryController(AppDbContext context)
        {
            _context = context;
        }

        // GET: /api/inventory
        // Returns list of inventory catalog items
        [HttpGet]
        public async Task<IActionResult> GetInventoryCatalog()
        {
            var items = await _context.InventoryItems
                .OrderByDescending(i => i.LastUpdated)
                .ToListAsync();

            return Ok(new { success = true, data = items });
        }

        // POST: /api/inventory
        // Adds a new product to inventory catalog
        [HttpPost]
        public async Task<IActionResult> CreateInventoryItem([FromBody] InventoryCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name) || dto.UnitPrice < 0)
            {
                return BadRequest(new { success = false, message = "Product name is required." });
            }

            var sku = dto.SKU;
            if (string.IsNullOrWhiteSpace(sku))
            {
                sku = $"SKU-{Random.Shared.Next(1000, 9999)}";
            }

            var item = new InventoryItem
            {
                SKU = sku,
                Name = dto.Name.Trim(),
                Category = string.IsNullOrWhiteSpace(dto.Category) ? "General" : dto.Category,
                Quantity = dto.Quantity,
                UnitPrice = dto.UnitPrice > 0 ? dto.UnitPrice : dto.Price,
                LastUpdated = DateTime.UtcNow
            };

            _context.InventoryItems.Add(item);

            _context.AuditLogs.Add(new AuditLog
            {
                Username = User.Identity?.Name ?? "Admin",
                Action = "Add Inventory Product",
                Details = $"Added product '{item.Name}' (SKU: {item.SKU}, Stock: {item.Quantity})",
                Timestamp = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Product added successfully!", data = item });
        }

        // PUT: /api/inventory/5
        // Updates quantity, price or category of existing catalog product
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateInventoryItem(int id, [FromBody] InventoryCreateDto dto)
        {
            var item = await _context.InventoryItems.FindAsync(id);
            if (item == null)
            {
                return NotFound(new { success = false, message = "Product not found." });
            }

            item.Name = !string.IsNullOrWhiteSpace(dto.Name) ? dto.Name.Trim() : item.Name;
            item.Category = !string.IsNullOrWhiteSpace(dto.Category) ? dto.Category : item.Category;
            item.Quantity = dto.Quantity;
            item.UnitPrice = dto.UnitPrice > 0 ? dto.UnitPrice : dto.Price > 0 ? dto.Price : item.UnitPrice;
            item.LastUpdated = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Product updated successfully!", data = item });
        }
    }

    public class InventoryCreateDto
    {
        public string? SKU { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = "General";
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal Price { get; set; } // Compatibility field with frontend
    }
}
