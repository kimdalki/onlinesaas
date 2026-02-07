using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pangeum.API.Data;

namespace Pangeum.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class JobsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;

    public JobsController(AppDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    [HttpGet("{jobId}")]
    public async Task<IActionResult> GetStatus(Guid jobId)
    {
        var job = await _db.Jobs
            .Include(j => j.Upload)
            .FirstOrDefaultAsync(j => j.JobId == jobId);

        if (job == null)
            return NotFound(new { error = "Job을 찾을 수 없습니다." });

        string? dxfUrl = job.Status == "Succeeded" ? $"/api/jobs/{jobId}/dxf" : null;

        return Ok(new
        {
            jobId = job.JobId,
            uploadId = job.UploadId,
            status = job.Status,
            progress = job.Progress,
            dxfUrl,
            errorMessage = job.ErrorMessage,
            originalFileName = job.Upload?.OriginalFileName,
            createdAt = job.CreatedAt,
            updatedAt = job.UpdatedAt
        });
    }

    [HttpGet("{jobId}/dxf")]
    public async Task<IActionResult> GetDxf(Guid jobId)
    {
        var job = await _db.Jobs
            .Include(j => j.Upload)
            .FirstOrDefaultAsync(j => j.JobId == jobId);

        if (job == null)
            return NotFound(new { error = "Job을 찾을 수 없습니다." });

        if (job.Status != "Succeeded" || job.Upload == null)
            return BadRequest(new { error = "파일이 아직 준비되지 않았습니다." });

        var filePath = job.Upload.StoredPath;
        if (!System.IO.File.Exists(filePath))
            return NotFound(new { error = "DXF 파일을 찾을 수 없습니다." });

        var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
        return File(fileBytes, "application/octet-stream", job.Upload.OriginalFileName);
    }
}
