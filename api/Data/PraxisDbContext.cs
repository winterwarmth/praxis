using Microsoft.EntityFrameworkCore;
using PraxisApi.Models;

namespace PraxisApi.Data;

public class PraxisDbContext(DbContextOptions<PraxisDbContext> options) : DbContext(options)
{
    public DbSet<Listing> Listings => Set<Listing>();
    public DbSet<ListingImage> ListingImages => Set<ListingImage>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<Course> Courses => Set<Course>();
    public DbSet<UserCourse> UserCourses => Set<UserCourse>();
    public DbSet<Semester> Semesters => Set<Semester>();
    public DbSet<ListingCourse> ListingCourses => Set<ListingCourse>();
    public DbSet<ListingSemester> ListingSemesters => Set<ListingSemester>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserCourse>()
            .HasKey(uc => new { uc.UserId, uc.CourseId });

        modelBuilder.Entity<ListingCourse>()
            .HasKey(lc => new { lc.ListingId, lc.CourseId });

        modelBuilder.Entity<ListingSemester>()
            .HasKey(ls => new { ls.ListingId, ls.SemesterId });
    }
}
