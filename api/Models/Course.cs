using System.ComponentModel.DataAnnotations.Schema;

namespace PraxisApi.Models;

[Table("courses")]
public class Course
{
    [Column("id")]
    public Guid Id { get; set; }

    [Column("subject_code")]
    public string SubjectCode { get; set; } = string.Empty;

    [Column("course_number")]
    public string CourseNumber { get; set; } = string.Empty;

    [Column("course_name")]
    public string CourseName { get; set; } = string.Empty;

    [Column("cross_list_group")]
    public Guid? CrossListGroup { get; set; }
}
