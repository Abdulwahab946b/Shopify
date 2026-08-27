using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Copilot.Data;

namespace Copilot.Controllers
{
    /// <summary>
    /// Beginner-Friendly API Controller for System Audit Trail.
    /// Endpoint Base: /api/audit-logs
    /// </summary>
    [ApiController]
    [Route("api/audit-logs")]
    public class AuditLogsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuditLogsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: /api/audit-logs
        // Returns list of system activity audit logs
        [HttpGet]
        public async Task<IActionResult> GetAuditLogs()
        {
            var logs = await _context.AuditLogs
                .OrderByDescending(l => l.Timestamp)
                .ToListAsync();

            return Ok(new { success = true, data = logs });
        }

        // DELETE: /api/audit-logs/5
        // Deletes a single audit log entry
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAuditLog(int id)
        {
            var log = await _context.AuditLogs.FindAsync(id);
            if (log == null)
            {
                return NotFound(new { success = false, message = "Audit log not found." });
            }

            _context.AuditLogs.Remove(log);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Audit log deleted." });
        }

        // DELETE: /api/audit-logs
        // Clears all system audit logs
        [HttpDelete]
        public async Task<IActionResult> ClearAllAuditLogs()
        {
            var logs = await _context.AuditLogs.ToListAsync();
            _context.AuditLogs.RemoveRange(logs);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Audit log history cleared." });
        }
    }
}
