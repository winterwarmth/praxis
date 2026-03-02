using Microsoft.EntityFrameworkCore;
using PraxisApi.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddDbContext<PraxisDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

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

app.Run();
