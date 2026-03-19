using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PraxisApi.Migrations
{
    /// <inheritdoc />
    public partial class AddSemesterToListingCourse : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "semester_id",
                table: "listing_courses",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_listing_courses_semester_id",
                table: "listing_courses",
                column: "semester_id");

            migrationBuilder.AddForeignKey(
                name: "FK_listing_courses_semesters_semester_id",
                table: "listing_courses",
                column: "semester_id",
                principalTable: "semesters",
                principalColumn: "id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_listing_courses_semesters_semester_id",
                table: "listing_courses");

            migrationBuilder.DropIndex(
                name: "IX_listing_courses_semester_id",
                table: "listing_courses");

            migrationBuilder.DropColumn(
                name: "semester_id",
                table: "listing_courses");
        }
    }
}
