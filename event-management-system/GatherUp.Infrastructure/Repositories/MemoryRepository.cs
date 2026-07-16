using GatherUp.Core.Interfaces;

namespace GatherUp.Infrastructure.Repositories;

public class MemoryRepository<T> : IRepository<T> where T : class, IIdentifiable
{
    private readonly List<T> _data = [];

    public IEnumerable<T> GetAll() => _data;

    public T? GetById(Guid id) => _data.FirstOrDefault(x => x.Id == id);

    public void Add(T entity) => _data.Add(entity);

    public void Update(T entity)
    {
        var index = _data.FindIndex(x => x.Id == entity.Id);
        if (index == -1) throw new KeyNotFoundException($"Entity {entity.Id} not found.");
        _data[index] = entity;
    }

    public void Delete(Guid id)
    {
        var removed = _data.RemoveAll(x => x.Id == id);
        if (removed == 0) throw new KeyNotFoundException($"Entity {id} not found.");
    }
}
