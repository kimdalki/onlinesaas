namespace Pangeum.API.Entities;

public class UploadEntity
{
    public Guid UploadId { get; set; }
    public string OriginalFileName { get; set; } = string.Empty;
    public string StoredPath { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public JobEntity? Job { get; set; }
}
