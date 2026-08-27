using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Copilot.Data;
using Copilot.Models;

namespace Copilot.Controllers
{
    /// <summary>
    /// Beginner-Friendly API Controller for Invoices Management.
    /// Endpoint Base: /api/invoices
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class InvoicesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public InvoicesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: /api/invoices
        // Retrieves all customer invoices ordered by newest first
        [HttpGet]
        public async Task<IActionResult> GetAllInvoices()
        {
            var invoices = await _context.Invoices
                .OrderByDescending(i => i.CreatedDate)
                .ToListAsync();

            return Ok(new { success = true, data = invoices });
        }

        // POST: /api/invoices
        // Creates a new customer invoice
        [HttpPost]
        public async Task<IActionResult> CreateInvoice([FromBody] InvoiceCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.CustomerName) || dto.Amount <= 0)
            {
                return BadRequest(new { success = false, message = "Customer name is required and amount must be > 0." });
            }

            var year = DateTime.UtcNow.Year;
            var invoiceCount = await _context.Invoices.CountAsync() + 1;
            var invoiceNumber = dto.InvoiceNumber;
            if (string.IsNullOrWhiteSpace(invoiceNumber))
            {
                invoiceNumber = $"INV-{year}-{invoiceCount:D3}";
            }

            var invoice = new Invoice
            {
                InvoiceNumber = invoiceNumber,
                CustomerName = dto.CustomerName.Trim(),
                Amount = dto.Amount,
                Status = string.IsNullOrWhiteSpace(dto.Status) ? "Pending" : dto.Status,
                Description = dto.Description?.Trim() ?? string.Empty,
                CreatedDate = DateTime.UtcNow
            };

            // Log activity to Audit Trail
            var audit = new AuditLog
            {
                Username = User.Identity?.Name ?? "Admin",
                Action = "Create Invoice",
                Details = $"Created invoice {invoiceNumber} for {invoice.CustomerName} (${invoice.Amount})",
                Timestamp = DateTime.UtcNow
            };

            _context.Invoices.Add(invoice);
            _context.AuditLogs.Add(audit);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Invoice created successfully!", data = invoice });
        }

        // PUT: /api/invoices/5/status
        // Updates status of an existing invoice (Paid, Pending, Overdue)
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateInvoiceStatus(int id, [FromBody] InvoiceStatusDto dto)
        {
            var invoice = await _context.Invoices.FindAsync(id);
            if (invoice == null)
            {
                return NotFound(new { success = false, message = "Invoice not found." });
            }

            var oldStatus = invoice.Status;
            invoice.Status = dto.Status;

            var audit = new AuditLog
            {
                Username = User.Identity?.Name ?? "Admin",
                Action = "Update Invoice Status",
                Details = $"Updated invoice {invoice.InvoiceNumber} status from '{oldStatus}' to '{dto.Status}'",
                Timestamp = DateTime.UtcNow
            };

            _context.AuditLogs.Add(audit);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Status updated successfully!" });
        }
    }

    // DTO Helper Classes for Request Payloads
    public class InvoiceCreateDto
    {
        public string? InvoiceNumber { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Status { get; set; } = "Pending";
        public string? Description { get; set; }
    }

    public class InvoiceStatusDto
    {
        public string Status { get; set; } = "Pending";
    }
}
