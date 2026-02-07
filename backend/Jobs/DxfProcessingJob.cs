using Microsoft.EntityFrameworkCore;
using Pangeum.API.Data;

namespace Pangeum.API.Jobs;

public class DxfProcessingJob
{
    private readonly IServiceProvider _serviceProvider;

    public DxfProcessingJob(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public async Task ProcessAsync(Guid jobId)
    {
        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var job = await db.Jobs.FirstOrDefaultAsync(j => j.JobId == jobId);
        if (job == null) return;

        try
        {
            // 상태 업데이트: Running
            job.Status = "Running";
            job.Progress = 10;
            job.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();

            // 클라이언트 사이드 파싱을 사용하므로, 서버에서는 파일 검증만 수행
            await Task.Delay(500); // 시뮬레이션

            job.Progress = 50;
            job.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();

            // 파일 존재 확인
            var upload = await db.Uploads.FirstOrDefaultAsync(u => u.UploadId == job.UploadId);
            if (upload == null || !File.Exists(upload.StoredPath))
            {
                throw new Exception("업로드된 DXF 파일을 찾을 수 없습니다.");
            }

            await Task.Delay(500); // 시뮬레이션

            // 성공
            job.Status = "Succeeded";
            job.Progress = 100;
            job.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            job.Status = "Failed";
            job.ErrorMessage = ex.Message;
            job.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();
        }
    }
}
