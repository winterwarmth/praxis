using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PraxisApi.Migrations
{
    /// <inheritdoc />
    public partial class AddListingSemesters : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
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

            migrationBuilder.CreateTable(
                name: "listing_semesters",
                columns: table => new
                {
                    listing_id = table.Column<Guid>(type: "uuid", nullable: false),
                    semester_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_listing_semesters", x => new { x.listing_id, x.semester_id });
                    table.ForeignKey(
                        name: "FK_listing_semesters_listings_listing_id",
                        column: x => x.listing_id,
                        principalTable: "listings",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_listing_semesters_semesters_semester_id",
                        column: x => x.semester_id,
                        principalTable: "semesters",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_listing_semesters_semester_id",
                table: "listing_semesters",
                column: "semester_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "listing_semesters");

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
    }
}
