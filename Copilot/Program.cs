using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.EntityFrameworkCore;
using System.Text;
using Copilot.Data;
using Copilot.Models;
using Microsoft.AspNetCore.Identity;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();

// Configure Cookie Policy to resolve Correlation Failed issues on HTTP localhost
builder.Services.Configure<CookiePolicyOptions>(options =>
{
    options.MinimumSameSitePolicy = SameSiteMode.Lax;
    options.Secure = CookieSecurePolicy.SameAsRequest;
});

// Register DbContext with SQL Server (SQLite version commented out below)
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
// builder.Services.AddDbContext<AppDbContext>(options =>
//     options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// Register password hasher for secure storage of credentials
builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();

// Register JWT Authentication
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddCookie("TempCookie", options =>
{
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
}) // Used by Google middleware to temporarily store identity
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
    };

    // Configure the bearer authentication to read the JWT token from a secure HttpOnly cookie
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            context.Token = context.Request.Cookies["jwt_token"];
            return Task.CompletedTask;
        }
    };
})
.AddGoogle(options =>
{
    options.ClientId = builder.Configuration["Authentication:Google:ClientId"] ?? "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";
    options.ClientSecret = builder.Configuration["Authentication:Google:ClientSecret"] ?? "YOUR_GOOGLE_CLIENT_SECRET";
    options.SignInScheme = "TempCookie";
});

var app = builder.Build();

// Automatically ensure the SQLite database is created
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    
    // Automatically ensure the database schema is created
    db.Database.EnsureCreated();

    // Seed data
    // Invoice seeding removed so they stay deleted.

    // Inventory and Purchase Order seeding removed so they stay deleted.

    // Purge all Shopify orders and line items
    if (db.ShopifyOrders.Any())
    {
        db.ShopifyOrderItems.RemoveRange(db.ShopifyOrderItems);
        db.ShopifyOrders.RemoveRange(db.ShopifyOrders);
        db.AuditLogs.Add(new Copilot.Models.AuditLog
        {
            Username = "System",
            Action = "Purge Shopify Orders",
            Details = "Deleted all Shopify orders and associated order items from database.",
            Timestamp = DateTime.UtcNow
        });
    }

    if (!db.AuditLogs.Any())
    {
        db.AuditLogs.Add(
            new Copilot.Models.AuditLog { Username = "System", Action = "Database Initialized", Details = "Default seed data populated into the ERP database schema.", Timestamp = DateTime.UtcNow }
        );
    }

    db.SaveChanges();
}

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseRouting();

app.UseCookiePolicy();
app.UseAuthentication(); // Ensure authentication is run before authorization
app.UseAuthorization();

app.MapStaticAssets();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Auth}/{action=Index}/{id?}")
    .WithStaticAssets();

app.Run();
