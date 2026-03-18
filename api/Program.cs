using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PraxisApi.Data;

var builder = WebApplication.CreateBuilder(args);

var supabaseUrl = builder.Configuration["Supabase:Url"]
    ?? throw new InvalidOperationException("Supabase:Url is not configured.");

builder.Services.AddOpenApi();
builder.Services.AddDbContext<PraxisDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = $"{supabaseUrl}/auth/v1";
        options.MetadataAddress = $"{supabaseUrl}/auth/v1/.well-known/openid-configuration";

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = $"{supabaseUrl}/auth/v1",
            ValidateAudience = true,
            ValidAudience = "authenticated",
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
        };
    });
builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:4200")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
else
{
    app.UseHttpsRedirection();
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

// --- Auth endpoints ---

app.MapPost("/api/auth/sync", async (PraxisDbContext db, ClaimsPrincipal user) =>
{
    var supabaseId = user.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? user.FindFirstValue("sub");
    var email = user.FindFirstValue(ClaimTypes.Email)
        ?? user.FindFirstValue("email");

    if (string.IsNullOrEmpty(supabaseId) || string.IsNullOrEmpty(email))
        return Results.BadRequest("Invalid token claims.");

    // Check by supabase_id first, then by email (for pre-existing/seed users)
    var existingUser = await db.Users.FirstOrDefaultAsync(u => u.SupabaseId == supabaseId)
        ?? await db.Users.FirstOrDefaultAsync(u => u.Email == email);

    if (existingUser != null)
    {
        if (string.IsNullOrEmpty(existingUser.SupabaseId) || existingUser.SupabaseId == "")
        {
            existingUser.SupabaseId = supabaseId;
            existingUser.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();
        }
        return Results.Ok(new { existingUser.Id, existingUser.Email, existingUser.Username, existingUser.FirstName, existingUser.LastName });
    }

    // Parse user_metadata from JWT (Supabase sends it as a nested JSON object)
    var metadataClaim = user.FindFirstValue("user_metadata");
    string firstName = "", lastName = "", username = email.Split('@')[0];

    if (!string.IsNullOrEmpty(metadataClaim))
    {
        var metadata = JsonSerializer.Deserialize<JsonElement>(metadataClaim);
        firstName = metadata.TryGetProperty("first_name", out var fn) ? fn.GetString() ?? "" : "";
        lastName = metadata.TryGetProperty("last_name", out var ln) ? ln.GetString() ?? "" : "";
        username = metadata.TryGetProperty("username", out var un) ? un.GetString() ?? email.Split('@')[0] : email.Split('@')[0];
    }

    var newUser = new PraxisApi.Models.User
    {
        Id = Guid.NewGuid(),
        SupabaseId = supabaseId,
        Email = email,
        FirstName = firstName,
        LastName = lastName,
        Username = username,
        Role = "student",
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow,
    };

    db.Users.Add(newUser);
    await db.SaveChangesAsync();

    return Results.Created($"/api/users/{newUser.Id}", new { newUser.Id, newUser.Email, newUser.Username, newUser.FirstName, newUser.LastName });
})
.RequireAuthorization();

app.MapGet("/api/auth/me", async (PraxisDbContext db, ClaimsPrincipal user) =>
{
    var supabaseId = user.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? user.FindFirstValue("sub");
    if (string.IsNullOrEmpty(supabaseId))
        return Results.Unauthorized();

    var dbUser = await db.Users.FirstOrDefaultAsync(u => u.SupabaseId == supabaseId);
    if (dbUser == null)
        return Results.NotFound();

    return Results.Ok(new { dbUser.Id, dbUser.Email, dbUser.Username, dbUser.FirstName, dbUser.LastName, dbUser.ProfileImageUrl });
})
.RequireAuthorization();

app.MapGet("/api/auth/lookup", async (string username, PraxisDbContext db) =>
{
    var user = await db.Users.FirstOrDefaultAsync(u => u.Username == username);
    if (user == null)
        return Results.NotFound("User not found.");

    return Results.Ok(new { user.Email });
});

app.MapGet("/api/auth/check-username", async (string username, PraxisDbContext db) =>
{
    var exists = await db.Users.AnyAsync(u => u.Username == username);
    return Results.Ok(new { available = !exists });
});

// --- Listing endpoints ---

app.MapGet("/api/listings", async (
    PraxisDbContext db,
    string? search,
    string? category,
    string? sort,
    decimal? minPrice,
    decimal? maxPrice) =>
{
    var query = db.Listings
        .Where(l => l.Status == "active")
        .AsQueryable();

    if (!string.IsNullOrWhiteSpace(search))
        query = query.Where(l => l.Title.ToLower().Contains(search.ToLower()));

    if (!string.IsNullOrWhiteSpace(category) && category != "All")
        query = query.Where(l => l.Category.ToLower() == category.ToLower());

    if (minPrice.HasValue)
        query = query.Where(l => l.Price >= minPrice.Value);

    if (maxPrice.HasValue)
        query = query.Where(l => l.Price <= maxPrice.Value);

    query = sort switch
    {
        "price-low" => query.OrderBy(l => l.Price),
        "price-high" => query.OrderByDescending(l => l.Price),
        _ => query.OrderByDescending(l => l.CreatedAt),
    };

    return await query
        .Select(l => new
        {
            l.Id,
            l.SellerId,
            l.Title,
            l.Description,
            l.Price,
            l.Category,
            l.Condition,
            l.Status,
            l.CreatedAt,
            l.UpdatedAt,
            ImageUrl = l.Images.OrderBy(i => i.DisplayOrder).Select(i => i.ImageUrl).FirstOrDefault()
        })
        .ToListAsync();
});

// --- Message endpoints ---

app.MapGet("/api/messages/{userId:guid}", async (Guid userId, PraxisDbContext db) =>
{
    var messages = await db.Messages
        .Include(m => m.Listing)
        .Include(m => m.Sender)
        .Include(m => m.Receiver)
        .Where(m => m.SenderId == userId || m.ReceiverId == userId)
        .OrderByDescending(m => m.CreatedAt)
        .ToListAsync();

    var threads = messages
        .GroupBy(m => new {
            OtherUserId = m.SenderId == userId ? m.ReceiverId : m.SenderId,
            m.ListingId
        })
        .Select(g =>
        {
            var latest = g.First();
            var otherUser = latest.SenderId == userId ? latest.Receiver : latest.Sender;

            return new
            {
                Id = latest.Id,
                OtherUserName = otherUser != null ? $"{otherUser.FirstName} {otherUser.LastName}" : "Unknown User",
                ItemTitle = latest.Listing?.Title ?? "Deleted Listing",
                LastMessage = latest.Content,
                IsUnread = !latest.IsRead && latest.ReceiverId == userId,
                Timestamp = latest.CreatedAt
            };
        });

    return Results.Ok(threads);
})
.RequireAuthorization();

app.Run();
