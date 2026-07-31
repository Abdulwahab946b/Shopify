using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Copilot.Data;
using Copilot.Models;

namespace Copilot.Controllers
{
    public class AuthController : Controller
    {
        private readonly AppDbContext _context;
        private readonly IPasswordHasher<User> _passwordHasher;
        private readonly IConfiguration _configuration;

        public AuthController(
            AppDbContext context, 
            IPasswordHasher<User> passwordHasher, 
            IConfiguration configuration)
        {
            _context = context;
            _passwordHasher = passwordHasher;
            _configuration = configuration;
        }

        // GET: /Auth
        [HttpGet]
        public IActionResult Index()
        {
            if (User.Identity != null && User.Identity.IsAuthenticated)
            {
                return RedirectToAction("Index", "Dashboard");
            }
            return View();
        }

        // POST: /Auth/Signup
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Signup(SignupViewModel model)
        {
            if (!ModelState.IsValid)
            {
                return Json(new { success = false, message = "Invalid input data.", errors = GetModelErrors() });
            }

            // Check if username already exists
            if (await _context.Users.AnyAsync(u => u.Username.ToLower() == model.Username.ToLower()))
            {
                return Json(new { success = false, message = "Username is already taken." });
            }

            // Check if email already exists
            if (await _context.Users.AnyAsync(u => u.Email.ToLower() == model.Email.ToLower()))
            {
                return Json(new { success = false, message = "Email address is already registered." });
            }

            // Create new User entity
            var user = new User
            {
                Username = model.Username.Trim(),
                Email = model.Email.Trim().ToLower()
            };

            // Securely hash the password
            user.PasswordHash = _passwordHasher.HashPassword(user, model.Password);

            try
            {
                _context.Users.Add(user);
                await _context.SaveChangesAsync();
                return Json(new { success = true, message = "Registration successful! You can now log in." });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "An error occurred while creating your account. Please try again." });
            }
        }

        // POST: /Auth/Login
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Login(LoginViewModel model)
        {
            if (!ModelState.IsValid)
            {
                return Json(new { success = false, message = "Username/Email and Password are required.", errors = GetModelErrors() });
            }

            var input = model.UsernameOrEmail.Trim().ToLower();

            // Find user by username or email
            var user = await _context.Users.FirstOrDefaultAsync(u => 
                u.Username.ToLower() == input || u.Email.ToLower() == input);

            if (user == null)
            {
                return Json(new { success = false, message = "Invalid username or password." });
            }

            // Verify password hash
            var passwordResult = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, model.Password);
            if (passwordResult == PasswordVerificationResult.Failed)
            {
                return Json(new { success = false, message = "Invalid username or password." });
            }

            // Generate JWT Token
            var token = GenerateJwtToken(user);

            // Append JWT token to HttpOnly secure cookie
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = Request.IsHttps,
                SameSite = SameSiteMode.Lax,
                Expires = DateTime.UtcNow.AddDays(_configuration.GetValue<int>("Jwt:ExpireDays"))
            };

            Response.Cookies.Append("jwt_token", token, cookieOptions);

            return Json(new { success = true, message = "Login successful! Redirecting...", redirectUrl = Url.Action("Index", "Dashboard") });
        }

        // POST: /Auth/Logout
        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult Logout()
        {
            Response.Cookies.Delete("jwt_token");
            return RedirectToAction("Index", "Auth");
        }

        // GET: /Auth/GoogleLogin
        [HttpGet]
        public IActionResult GoogleLogin()
        {
            var clientId = _configuration["Authentication:Google:ClientId"];
            if (string.IsNullOrEmpty(clientId) || clientId == "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com")
            {
                TempData["ErrorMessage"] = "Google Client ID is not configured. Please set 'Authentication:Google:ClientId' and 'ClientSecret' in appsettings.json.";
                return RedirectToAction("Index");
            }

            var redirectUrl = Url.Action("GoogleResponse");
            var properties = new AuthenticationProperties { RedirectUri = redirectUrl };
            return Challenge(properties, GoogleDefaults.AuthenticationScheme);
        }

        // GET: /Auth/GoogleResponse
        [HttpGet]
        public async Task<IActionResult> GoogleResponse()
        {
            var result = await HttpContext.AuthenticateAsync("TempCookie");
            if (!result.Succeeded || result.Principal == null)
            {
                TempData["ErrorMessage"] = "Google authentication failed. Please try again.";
                return RedirectToAction("Index");
            }

            // Extract claims from Google identity
            var email = result.Principal.FindFirstValue(ClaimTypes.Email);
            var name = result.Principal.FindFirstValue(ClaimTypes.Name);

            if (string.IsNullOrEmpty(email))
            {
                TempData["ErrorMessage"] = "Failed to retrieve email from Google login.";
                return RedirectToAction("Index");
            }

            // Check if user exists, or create a new user
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());
            if (user == null)
            {
                // Generate a unique username if Google name is taken
                var baseUsername = name?.Replace(" ", "") ?? email.Split('@')[0];
                var username = baseUsername;
                int counter = 1;
                while (await _context.Users.AnyAsync(u => u.Username.ToLower() == username.ToLower()))
                {
                    username = $"{baseUsername}{counter++}";
                }

                user = new User
                {
                    Username = username,
                    Email = email.ToLower(),
                    PasswordHash = "GOOGLE_EXTERNAL_LOGIN_" + Guid.NewGuid().ToString("N") // Dummy hash
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();
            }

            // Generate JWT Token
            var token = GenerateJwtToken(user);

            // Set cookie
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = Request.IsHttps,
                SameSite = SameSiteMode.Lax,
                Expires = DateTime.UtcNow.AddDays(_configuration.GetValue<int>("Jwt:ExpireDays"))
            };
            Response.Cookies.Append("jwt_token", token, cookieOptions);

            // Clean up the temporary cookie
            await HttpContext.SignOutAsync("TempCookie");

            return RedirectToAction("Index", "Dashboard");
        }

        // Helper method to generate JWT
        private string GenerateJwtToken(User user)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var keyBytes = Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!);
            var key = new SymmetricSecurityKey(keyBytes);
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddDays(_configuration.GetValue<int>("Jwt:ExpireDays")),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        // Helper to collect validation errors
        private System.Collections.Generic.List<string> GetModelErrors()
        {
            var errors = new System.Collections.Generic.List<string>();
            foreach (var state in ModelState.Values)
            {
                foreach (var error in state.Errors)
                {
                    errors.Add(error.ErrorMessage);
                }
            }
            return errors;
        }
    }
}
