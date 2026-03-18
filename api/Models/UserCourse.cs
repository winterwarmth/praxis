using System.ComponentModel.DataAnnotations.Schema;

namespace PraxisApi.Models;

[Table("user_courses")]
public class UserCourse
{
    [Column("user_id")]
    public Guid UserId { get; set; }

    [Column("course_id")]
    public Guid CourseId { get; set; }

    [Column("semester_id")]
    public Guid? SemesterId { get; set; }

    public User? User { get; set; }
    public Course? Course { get; set; }
    public Semester? Semester { get; set; }
}
