using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Hangfire;
using Pangeum.API.Data;
using Pangeum.API.Entities;
using Pangeum.API.Jobs;

namespace Pangeum.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UploadsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IBackgroundJobClient _backgroundJobs;
    private readonly IWebHostEnvironment _env;

    public UploadsController(AppDbContext db, IBackgroundJobClient backgroundJobs, IWebHostEnvironment env)
    {
        _db = db;
        _backgroundJobs = backgroundJobs;
        _env = env;
    }

    [HttpPost]
    [RequestSizeLimit(20 * 1024 * 1024)] // 20MB
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "파일이 필요합니다." });

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (ext != ".dxf")
            return BadRequest(new { error = ".dxf 파일만 업로드 가능합니다." });

        var uploadId = Guid.NewGuid();
        var jobId = Guid.NewGuid();

        // 저장 경로 설정
        var uploadDir = Path.Combine(_env.ContentRootPath, "storage", "uploads");
        Directory.CreateDirectory(uploadDir);

        var storedPath = Path.Combine(uploadDir, $"{uploadId}.dxf");

        // 파일 저장
        using (var stream = new FileStream(storedPath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // DB 엔티티 생성
        var upload = new UploadEntity
        {
            UploadId = uploadId,
            OriginalFileName = Path.GetFileName(file.FileName),
            StoredPath = storedPath,
            SizeBytes = file.Length,
            CreatedAt = DateTime.UtcNow
        };

        var job = new JobEntity
        {
            JobId = jobId,
            UploadId = uploadId,
            Status = "Queued",
            Progress = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Uploads.Add(upload);
        _db.Jobs.Add(job);
        await _db.SaveChangesAsync();

        // Hangfire Job 등록 (클라이언트 사이드 파싱이므로 실제로는 파일 준비 상태만 업데이트)
        _backgroundJobs.Enqueue<DxfProcessingJob>(x => x.ProcessAsync(jobId));

        return Ok(new { jobId, uploadId });
    }
}
