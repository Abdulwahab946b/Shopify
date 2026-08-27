using Microsoft.EntityFrameworkCore;
using Copilot.Models;

namespace Copilot.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Invoice> Invoices { get; set; }
        public DbSet<InventoryItem> InventoryItems { get; set; }
        public DbSet<PurchaseOrder> PurchaseOrders { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<ShopifyOrder> ShopifyOrders { get; set; }
        public DbSet<ShopifyOrderItem> ShopifyOrderItems { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure unique index for Username and Email
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Username)
                .IsUnique();

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            // Configure unique indexes for business identifiers
            modelBuilder.Entity<Invoice>()
                .HasIndex(i => i.InvoiceNumber)
                .IsUnique();

            modelBuilder.Entity<InventoryItem>()
                .HasIndex(ii => ii.SKU)
                .IsUnique();

            modelBuilder.Entity<PurchaseOrder>()
                .HasIndex(po => po.PONumber)
                .IsUnique();

            // Configure unique index for ShopifyOrder (OrderNumber is unique per ShopifyDomain)
            modelBuilder.Entity<ShopifyOrder>()
                .HasIndex(so => new { so.OrderNumber, so.ShopifyDomain })
                .IsUnique();
        }
    }
}
