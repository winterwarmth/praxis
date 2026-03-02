using Microsoft.EntityFrameworkCore;
using PraxisApi.Models;

namespace PraxisApi.Data;

public class PraxisDbContext(DbContextOptions<PraxisDbContext> options) : DbContext(options)
{
    public DbSet<Listing> Listings => Set<Listing>();
}
