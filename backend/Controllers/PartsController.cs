using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pangeum.API.Data;

namespace Pangeum.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PartsController : ControllerBase
{
    private readonly AppDbContext _db;

    public PartsController(AppDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// 모든 파트(성공적으로 처리된 업로드) 목록을 반환합니다.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetParts()
    {
        var parts = await _db.Jobs
            .Include(j => j.Upload)
            .Where(j => j.Status == "Succeeded" || j.Status == "Running" || j.Status == "Queued")
            .OrderByDescending(j => j.CreatedAt)
            .Select(j => new
            {
                id = j.JobId.ToString(),
                fileName = j.Upload != null ? j.Upload.OriginalFileName : "Unknown",
                fileType = "AutoCAD DXF R12",
                dimensions = "Calculating...",
                status = j.Status == "Succeeded" ? "ready" :
                         j.Status == "Running" ? "processing" :
                         j.Status == "Queued" ? "processing" : "pending",
                dxfUrl = j.Status == "Succeeded" ? $"/api/jobs/{j.JobId}/dxf" : null,
                createdAt = j.CreatedAt
            })
            .ToListAsync();

        return Ok(parts);
    }

    /// <summary>
    /// 특정 파트를 삭제합니다. (DB 레코드 및 실제 파일 삭제)
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePart(Guid id)
    {
        var job = await _db.Jobs
            .Include(j => j.Upload)
            .FirstOrDefaultAsync(j => j.JobId == id);

        if (job == null)
        {
            return NotFound();
        }

        try
        {
            // 1. DXF 파일 삭제
            if (job.Upload != null && !string.IsNullOrEmpty(job.Upload.StoredPath))
            {
                if (System.IO.File.Exists(job.Upload.StoredPath))
                {
                    System.IO.File.Delete(job.Upload.StoredPath);
                }
            }

            // 2. SVG 파일 삭제
            if (!string.IsNullOrEmpty(job.SvgPath))
            {
                // SvgPath는 웹 경로일 수 있으므로 실제 물리 경로로 변환 필요할 수 있음
                // 하지만 현재 구현상 SvgPath가 물리 경로인지 웹 경로인지 확인 필요.
                // 보통 wwwroot/uploads/... 이런 식이라면 물리 경로로 매핑해야 함.
                // 일단 SvgPath가 전체 경로를 담고 있다고 가정하거나, 웹 경로라면 변환 로직 추가.
                // 여기서는 SvgPath가 상대경로라면 Path.Combine으로 처리.
                
                // 만약 SvgPath가 "/uploads/..." 형태의 웹 URL 경로라면:
                var relativePath = job.SvgPath.TrimStart('/');
                var physicalPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", relativePath);
                
                // 만약 SvgPath가 이미 절대 경로라면 그대로 사용
                if (Path.IsPathRooted(job.SvgPath))
                {
                    physicalPath = job.SvgPath;
                }

                if (System.IO.File.Exists(physicalPath))
                {
                    System.IO.File.Delete(physicalPath);
                }
            }

            // 3. DB 레코드 삭제
            // Cascade delete가 설정되어 있다면 Upload도 같이 삭제되겠지만, 명시적으로 삭제
            if (job.Upload != null)
            {
                _db.Uploads.Remove(job.Upload);
            }
            _db.Jobs.Remove(job);
            
            await _db.SaveChangesAsync();

            return Ok(new { message = "Part deleted successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error deleting part", error = ex.Message });
        }
    }
}
