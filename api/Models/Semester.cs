using System.ComponentModel.DataAnnotations.Schema;

namespace PraxisApi.Models;

[Table("semesters")]
public class Semester
{
    [Column("id")]
    public Guid Id { get; set; }

    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("year")]
    public int Year { get; set; }

    [Column("term")]
    public string Term { get; set; } = string.Empty;
}
