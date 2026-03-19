using System.ComponentModel.DataAnnotations.Schema;

namespace PraxisApi.Models;

[Table("listing_courses")]
public class ListingCourse
{
    [Column("listing_id")]
    public Guid ListingId { get; set; }

    [Column("course_id")]
    public Guid CourseId { get; set; }

    public Listing Listing { get; set; } = null!;
    public Course Course { get; set; } = null!;
}
