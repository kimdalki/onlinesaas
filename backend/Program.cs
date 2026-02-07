using Microsoft.EntityFrameworkCore;
using Hangfire;
using Hangfire.Storage.SQLite;
using Pangeum.API.Data;
using Pangeum.API.Jobs;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// EF Core + SQLite
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("AppDb")));

// Hangfire with SQLite
builder.Services.AddHangfire(config => config
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UseSQLiteStorage(builder.Configuration.GetConnectionString("HangfireDb")));

builder.Services.AddHangfireServer();

// Register Job class
builder.Services.AddScoped<DxfProcessingJob>();

// CORS for React dev server
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// Configure pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseHangfireDashboard("/hangfire");
}

app.UseCors();

app.UseAuthorization();

app.MapControllers();

// Ensure storage directories exist
var storagePath = Path.Combine(app.Environment.ContentRootPath, "storage");
Directory.CreateDirectory(Path.Combine(storagePath, "uploads"));
Directory.CreateDirectory(Path.Combine(storagePath, "svgs"));

app.Run();
