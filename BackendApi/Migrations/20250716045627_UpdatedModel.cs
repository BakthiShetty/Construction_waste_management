using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BackendApi.Migrations
{
    /// <inheritdoc />
    public partial class UpdatedModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MaterialId1",
                table: "Requests",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Requests_MaterialId1",
                table: "Requests",
                column: "MaterialId1");

            migrationBuilder.AddForeignKey(
                name: "FK_Requests_Materials_MaterialId1",
                table: "Requests",
                column: "MaterialId1",
                principalTable: "Materials",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Requests_Materials_MaterialId1",
                table: "Requests");

            migrationBuilder.DropIndex(
                name: "IX_Requests_MaterialId1",
                table: "Requests");

            migrationBuilder.DropColumn(
                name: "MaterialId1",
                table: "Requests");
        }
    }
}
