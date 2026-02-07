namespace Pangeum.API.Entities;

public class JobEntity
{
    public Guid JobId { get; set; }
    public Guid UploadId { get; set; }
    public string Status { get; set; } = "Queued"; // Queued | Running | Succeeded | Failed
    public int Progress { get; set; } = 0;
    public string? SvgPath { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public UploadEntity Upload { get; set; } = null!;
}
