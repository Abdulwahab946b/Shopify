using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Copilot.Data;
using Copilot.Models;

namespace Copilot.Controllers
{
    /// <summary>
    /// Beginner-Friendly API Controller for Purchase Orders Requisitions.
    /// Endpoint Base: /api/purchase-orders
    /// </summary>
    [ApiController]
    [Route("api/purchase-orders")]
    public class PurchaseOrdersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PurchaseOrdersController(AppDbContext context)
        {
            _context = context;
        }

        // GET: /api/purchase-orders
        // Lists all vendor purchase orders
        [HttpGet]
        public async Task<IActionResult> GetAllPurchaseOrders()
        {
            var orders = await _context.PurchaseOrders
                .OrderByDescending(po => po.OrderDate)
                .ToListAsync();

            return Ok(new { success = true, data = orders });
        }

        // POST: /api/purchase-orders
        // Creates a new vendor purchase order
        [HttpPost]
        public async Task<IActionResult> CreatePurchaseOrder([FromBody] PoCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.SupplierName))
            {
                return BadRequest(new { success = false, message = "Supplier name is required." });
            }

            var year = DateTime.UtcNow.Year;
            var poCount = await _context.PurchaseOrders.CountAsync() + 1;
            var poNumber = dto.PoNumber;
            if (string.IsNullOrWhiteSpace(poNumber))
            {
                poNumber = $"PO-{year}-{poCount:D4}";
            }

            var qty = dto.Quantity > 0 ? dto.Quantity : 1;
            var unitCost = dto.UnitCost > 0 ? dto.UnitCost : dto.UnitPrice;
            var totalCost = qty * unitCost;

            var po = new PurchaseOrder
            {
                PONumber = poNumber,
                SupplierName = dto.SupplierName.Trim(),
                ItemName = dto.ItemsDescription ?? dto.ItemName ?? "General Goods",
                Quantity = qty,
                UnitPrice = unitCost,
                TotalCost = totalCost,
                Status = string.IsNullOrWhiteSpace(dto.Status) ? "Pending" : dto.Status,
                OrderDate = DateTime.UtcNow
            };

            _context.PurchaseOrders.Add(po);

            _context.AuditLogs.Add(new AuditLog
            {
                Username = User.Identity?.Name ?? "Admin",
                Action = "Issue Purchase Order",
                Details = $"Issued PO {poNumber} to supplier {po.SupplierName} (${totalCost})",
                Timestamp = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Purchase Order issued successfully!", data = po });
        }

        // PUT: /api/purchase-orders/5/status
        // Updates PO status
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdatePoStatus(int id, [FromBody] PoStatusDto dto)
        {
            var po = await _context.PurchaseOrders.FindAsync(id);
            if (po == null)
            {
                return NotFound(new { success = false, message = "Purchase Order not found." });
            }

            po.Status = dto.Status;
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Purchase Order status updated!" });
        }
    }

    public class PoCreateDto
    {
        public string? PoNumber { get; set; }
        public string SupplierName { get; set; } = string.Empty;
        public string? ItemsDescription { get; set; }
        public string? ItemName { get; set; }
        public int Quantity { get; set; }
        public decimal UnitCost { get; set; }
        public decimal UnitPrice { get; set; }
        public string Status { get; set; } = "Pending";
    }

    public class PoStatusDto
    {
        public string Status { get; set; } = "Pending";
    }
}
