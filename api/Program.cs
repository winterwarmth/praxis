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

    if (!email.EndsWith(".edu", StringComparison.OrdinalIgnoreCase))
        return Results.BadRequest("Only .edu email addresses are allowed.");

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
        Role = email.EndsWith("@student.gsu.edu", StringComparison.OrdinalIgnoreCase) ? "student"
            : email.EndsWith("@gsu.edu", StringComparison.OrdinalIgnoreCase) ? "faculty"
            : "student",
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

    return Results.Ok(new { dbUser.Id, dbUser.Email, dbUser.Username, dbUser.FirstName, dbUser.LastName, dbUser.ProfileImageUrl, dbUser.Role, dbUser.Bio, dbUser.UsernameChangedAt, dbUser.PreferredPaymentMethods });
})
.RequireAuthorization();

app.MapPut("/api/auth/profile", async (PraxisDbContext db, ClaimsPrincipal user, HttpContext context) =>
{
    var supabaseId = user.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? user.FindFirstValue("sub");
    if (string.IsNullOrEmpty(supabaseId))
        return Results.Unauthorized();

    var dbUser = await db.Users.FirstOrDefaultAsync(u => u.SupabaseId == supabaseId);
    if (dbUser == null)
        return Results.NotFound();

    var body = await context.Request.ReadFromJsonAsync<ProfileUpdateRequest>();
    if (body == null)
        return Results.BadRequest();

    if (!string.IsNullOrWhiteSpace(body.Username) && body.Username != dbUser.Username)
    {
        if (dbUser.UsernameChangedAt.HasValue &&
            (DateTime.UtcNow - dbUser.UsernameChangedAt.Value).TotalDays < 60)
        {
            var nextChange = dbUser.UsernameChangedAt.Value.AddDays(60);
            return Results.BadRequest($"Username can only be changed once every 60 days. Next change available on {nextChange:MMM d, yyyy}.");
        }

        var taken = await db.Users.AnyAsync(u => u.Username == body.Username && u.Id != dbUser.Id);
        if (taken)
            return Results.Conflict("Username is already taken.");
        dbUser.Username = body.Username;
        dbUser.UsernameChangedAt = DateTime.UtcNow;
    }

    if (body.FirstName != null) dbUser.FirstName = body.FirstName;
    if (body.LastName != null) dbUser.LastName = body.LastName;
    if (body.Bio != null) dbUser.Bio = body.Bio;
    if (body.PreferredPaymentMethods != null) dbUser.PreferredPaymentMethods = body.PreferredPaymentMethods;
    if (body.ProfileImageUrl != null) dbUser.ProfileImageUrl = body.ProfileImageUrl;

    dbUser.UpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();

    return Results.Ok(new { dbUser.Id, dbUser.Email, dbUser.Username, dbUser.FirstName, dbUser.LastName, dbUser.ProfileImageUrl, dbUser.Role, dbUser.Bio, dbUser.UsernameChangedAt, dbUser.PreferredPaymentMethods });
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

// --- Course endpoints ---

app.MapGet("/api/auth/courses", async (PraxisDbContext db, ClaimsPrincipal user) =>
{
    var supabaseId = user.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? user.FindFirstValue("sub");
    if (string.IsNullOrEmpty(supabaseId))
        return Results.Unauthorized();

    var dbUser = await db.Users.FirstOrDefaultAsync(u => u.SupabaseId == supabaseId);
    if (dbUser == null)
        return Results.NotFound();

    var courses = await db.UserCourses
        .Where(uc => uc.UserId == dbUser.Id)
        .Include(uc => uc.Course)
        .Include(uc => uc.Semester)
        .Select(uc => new { uc.Course!.Id, uc.Course.SubjectCode, uc.Course.CourseNumber, uc.Course.CourseName, SemesterName = uc.Semester != null ? uc.Semester.Name : null })
        .ToListAsync();

    return Results.Ok(courses);
})
.RequireAuthorization();

app.MapPut("/api/auth/courses", async (PraxisDbContext db, ClaimsPrincipal user, List<Guid> courseIds) =>
{
    var supabaseId = user.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? user.FindFirstValue("sub");
    if (string.IsNullOrEmpty(supabaseId))
        return Results.Unauthorized();

    var dbUser = await db.Users.FirstOrDefaultAsync(u => u.SupabaseId == supabaseId);
    if (dbUser == null)
        return Results.NotFound();

    var existing = await db.UserCourses.Where(uc => uc.UserId == dbUser.Id).ToListAsync();
    db.UserCourses.RemoveRange(existing);

    foreach (var courseId in courseIds)
    {
        db.UserCourses.Add(new PraxisApi.Models.UserCourse { UserId = dbUser.Id, CourseId = courseId });
    }

    await db.SaveChangesAsync();

    var courses = await db.UserCourses
        .Where(uc => uc.UserId == dbUser.Id)
        .Include(uc => uc.Course)
        .Select(uc => new { uc.Course!.Id, uc.Course.SubjectCode, uc.Course.CourseNumber, uc.Course.CourseName })
        .ToListAsync();

    return Results.Ok(courses);
})
.RequireAuthorization();

app.MapGet("/api/courses", async (PraxisDbContext db, string? subject) =>
{
    var query = db.Courses.AsQueryable();

    if (!string.IsNullOrWhiteSpace(subject))
        query = query.Where(c => c.SubjectCode == subject.ToUpper());

    return await query
        .OrderBy(c => c.SubjectCode)
        .ThenBy(c => c.CourseNumber)
        .Select(c => new { c.Id, c.SubjectCode, c.CourseNumber, c.CourseName, c.CrossListGroup })
        .ToListAsync();
});

app.MapGet("/api/semesters", async (PraxisDbContext db) =>
{
    return await db.Semesters
        .OrderByDescending(s => s.Year)
        .ThenByDescending(s => s.Term)
        .Select(s => new { s.Id, s.Name, s.Year, s.Term })
        .ToListAsync();
});

// --- Review endpoints ---

app.MapGet("/api/users/{userId:guid}/reviews", async (Guid userId, PraxisDbContext db) =>
{
    var reviews = await db.Reviews
        .Where(r => r.RevieweeId == userId)
        .Include(r => r.Reviewer)
        .OrderByDescending(r => r.CreatedAt)
        .Select(r => new
        {
            r.Id,
            r.Rating,
            r.Comment,
            r.CreatedAt,
            ReviewerName = r.Reviewer != null ? $"{r.Reviewer.FirstName} {r.Reviewer.LastName}" : "Unknown",
            ReviewerUsername = r.Reviewer != null ? r.Reviewer.Username : "unknown",
        })
        .ToListAsync();

    var avgRating = reviews.Count > 0 ? reviews.Average(r => r.Rating) : 0;

    return Results.Ok(new { reviews, averageRating = Math.Round(avgRating, 1), totalReviews = reviews.Count });
});

// --- Listing endpoints ---

app.MapGet("/api/listings", async (
    PraxisDbContext db,
    string? search,
    string? category,
    string? sort,
    decimal? minPrice,
    decimal? maxPrice,
    Guid? sellerId,
    string? status) =>
{
    var query = db.Listings
        .Where(l => l.Status == (status ?? "active"))
        .AsQueryable();

    if (sellerId.HasValue)
        query = query.Where(l => l.SellerId == sellerId.Value);

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

app.MapGet("/api/listings/{id:guid}", async (Guid id, PraxisDbContext db) =>
{
    var listing = await db.Listings
        .Where(l => l.Id == id)
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
            Images = l.Images
                .OrderBy(i => i.DisplayOrder)
                .Select(i => new { i.Id, i.ImageUrl, i.DisplayOrder })
                .ToList(),
            Seller = db.Users
                .Where(u => u.Id == l.SellerId)
                .Select(u => new
                {
                    u.Id,
                    u.Username,
                    u.FirstName,
                    u.LastName,
                    u.ProfileImageUrl,
                    u.Role,
                    u.PreferredPaymentMethods,
                })
                .FirstOrDefault()
        })
        .FirstOrDefaultAsync();

    if (listing == null)
        return Results.NotFound();

    return Results.Ok(listing);
});

app.MapPost("/api/listings", async (PraxisDbContext db, ClaimsPrincipal user, HttpContext context) =>
{
    var supabaseId = user.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? user.FindFirstValue("sub");
    if (string.IsNullOrEmpty(supabaseId))
        return Results.Unauthorized();

    var dbUser = await db.Users.FirstOrDefaultAsync(u => u.SupabaseId == supabaseId);
    if (dbUser == null)
        return Results.NotFound("User not found.");

    var body = await context.Request.ReadFromJsonAsync<CreateListingRequest>();
    if (body == null || string.IsNullOrWhiteSpace(body.Title) || string.IsNullOrWhiteSpace(body.Category))
        return Results.BadRequest("Title and category are required.");

    var listing = new PraxisApi.Models.Listing
    {
        Id = Guid.NewGuid(),
        SellerId = dbUser.Id,
        Title = body.Title.Trim(),
        Description = body.Description?.Trim(),
        Price = body.Price,
        Category = body.Category.ToLower(),
        Condition = body.Condition,
        Status = "active",
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow,
    };

    db.Listings.Add(listing);
    await db.SaveChangesAsync();

    return Results.Created($"/api/listings/{listing.Id}", new { listing.Id });
})
.RequireAuthorization();

app.MapPut("/api/listings/{id:guid}", async (Guid id, PraxisDbContext db, ClaimsPrincipal user, HttpContext context) =>
{
    var supabaseId = user.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? user.FindFirstValue("sub");
    if (string.IsNullOrEmpty(supabaseId))
        return Results.Unauthorized();

    var dbUser = await db.Users.FirstOrDefaultAsync(u => u.SupabaseId == supabaseId);
    if (dbUser == null)
        return Results.NotFound();

    var listing = await db.Listings.FirstOrDefaultAsync(l => l.Id == id && l.SellerId == dbUser.Id);
    if (listing == null)
        return Results.NotFound();

    var body = await context.Request.ReadFromJsonAsync<UpdateListingRequest>();
    if (body == null)
        return Results.BadRequest();

    if (!string.IsNullOrWhiteSpace(body.Title)) listing.Title = body.Title.Trim();
    if (body.Description != null) listing.Description = body.Description.Trim();
    if (body.Price.HasValue) listing.Price = body.Price.Value;
    if (!string.IsNullOrWhiteSpace(body.Category)) listing.Category = body.Category.ToLower();
    if (body.Condition != null) listing.Condition = body.Condition;
    if (!string.IsNullOrWhiteSpace(body.Status)) listing.Status = body.Status;

    listing.UpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();

    return Results.Ok(new { listing.Id });
})
.RequireAuthorization();

app.MapPost("/api/listings/{id:guid}/images", async (Guid id, PraxisDbContext db, ClaimsPrincipal user, List<string> imageUrls) =>
{
    var supabaseId = user.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? user.FindFirstValue("sub");
    if (string.IsNullOrEmpty(supabaseId))
        return Results.Unauthorized();

    var dbUser = await db.Users.FirstOrDefaultAsync(u => u.SupabaseId == supabaseId);
    if (dbUser == null)
        return Results.NotFound();

    var listing = await db.Listings.FirstOrDefaultAsync(l => l.Id == id && l.SellerId == dbUser.Id);
    if (listing == null)
        return Results.NotFound();

    var maxOrder = await db.ListingImages
        .Where(i => i.ListingId == id)
        .OrderByDescending(i => i.DisplayOrder)
        .Select(i => (int?)i.DisplayOrder)
        .FirstOrDefaultAsync() ?? -1;

    for (var i = 0; i < imageUrls.Count; i++)
    {
        db.ListingImages.Add(new PraxisApi.Models.ListingImage
        {
            Id = Guid.NewGuid(),
            ListingId = id,
            ImageUrl = imageUrls[i],
            DisplayOrder = maxOrder + 1 + i,
        });
        await db.SaveChangesAsync();
    }

    return Results.Ok();
})
.RequireAuthorization();

app.MapPut("/api/listings/{listingId:guid}/images/reorder", async (Guid listingId, PraxisDbContext db, ClaimsPrincipal user, List<Guid> imageIds) =>
{
    var supabaseId = user.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? user.FindFirstValue("sub");
    if (string.IsNullOrEmpty(supabaseId))
        return Results.Unauthorized();

    var dbUser = await db.Users.FirstOrDefaultAsync(u => u.SupabaseId == supabaseId);
    if (dbUser == null)
        return Results.NotFound();

    var listing = await db.Listings.FirstOrDefaultAsync(l => l.Id == listingId && l.SellerId == dbUser.Id);
    if (listing == null)
        return Results.NotFound();

    for (var i = 0; i < imageIds.Count; i++)
    {
        var image = await db.ListingImages.FirstOrDefaultAsync(img => img.Id == imageIds[i] && img.ListingId == listingId);
        if (image != null)
        {
            image.DisplayOrder = i;
            await db.SaveChangesAsync();
        }
    }

    return Results.Ok();
})
.RequireAuthorization();

app.MapDelete("/api/listings/{listingId:guid}/images/{imageId:guid}", async (Guid listingId, Guid imageId, PraxisDbContext db, ClaimsPrincipal user) =>
{
    var supabaseId = user.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? user.FindFirstValue("sub");
    if (string.IsNullOrEmpty(supabaseId))
        return Results.Unauthorized();

    var dbUser = await db.Users.FirstOrDefaultAsync(u => u.SupabaseId == supabaseId);
    if (dbUser == null)
        return Results.NotFound();

    var listing = await db.Listings.FirstOrDefaultAsync(l => l.Id == listingId && l.SellerId == dbUser.Id);
    if (listing == null)
        return Results.NotFound();

    var image = await db.ListingImages.FirstOrDefaultAsync(i => i.Id == imageId && i.ListingId == listingId);
    if (image == null)
        return Results.NotFound();

    db.ListingImages.Remove(image);
    await db.SaveChangesAsync();

    return Results.Ok();
})
.RequireAuthorization();

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

record ProfileUpdateRequest(string? FirstName, string? LastName, string? Username, string? Bio, string? PreferredPaymentMethods, string? ProfileImageUrl);
record CreateListingRequest(string Title, string? Description, decimal Price, string Category, string? Condition, List<string>? ImageUrls);
record UpdateListingRequest(string? Title, string? Description, decimal? Price, string? Category, string? Condition, string? Status);
