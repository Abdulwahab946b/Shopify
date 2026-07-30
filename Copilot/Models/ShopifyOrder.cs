using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Copilot.Models
{
    public class ShopifyOrder
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string OrderNumber { get; set; } = string.Empty; // e.g. #1001

        [Required]
        [MaxLength(100)]
        public string ShopifyDomain { get; set; } = string.Empty; // e.g. my-store.myshopify.com

        [Required]
        [MaxLength(100)]
        public string CustomerName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [MaxLength(100)]
        public string CustomerEmail { get; set; } = string.Empty;

        [MaxLength(30)]
        public string CustomerPhone { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string ShippingAddress { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string City { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Province { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Country { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string ZipCode { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Subtotal { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal ShippingCost { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal TaxCost { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        [Required]
        [MaxLength(30)]
        public string FinancialStatus { get; set; } = "Pending"; // Paid, Pending, Refunded, Voided

        [Required]
        [MaxLength(30)]
        public string FulfillmentStatus { get; set; } = "Unfulfilled"; // Unfulfilled, Fulfilled, Restocked

        [MaxLength(500)]
        public string OrderNotes { get; set; } = string.Empty;

        [Required]
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public List<ShopifyOrderItem> OrderItems { get; set; } = new List<ShopifyOrderItem>();
    }
}
