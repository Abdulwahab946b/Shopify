using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Copilot.Models
{
    public class ShopifyOrderItem
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ShopifyOrderId { get; set; }

        [ForeignKey("ShopifyOrderId")]
        [JsonIgnore] // Avoid circular reference issues during JSON serialization
        public ShopifyOrder? ShopifyOrder { get; set; }

        [Required]
        [MaxLength(50)]
        public string SKU { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string ItemName { get; set; } = string.Empty;

        [Required]
        public int Quantity { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitPrice { get; set; }
    }
}
