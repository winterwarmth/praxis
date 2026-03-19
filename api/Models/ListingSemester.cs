using System.ComponentModel.DataAnnotations.Schema;

namespace PraxisApi.Models;

[Table("listing_semesters")]
public class ListingSemester
{
    [Column("listing_id")]
    public Guid ListingId { get; set; }

    [Column("semester_id")]
    public Guid SemesterId { get; set; }

    public Listing Listing { get; set; } = null!;
    public Semester Semester { get; set; } = null!;
}
