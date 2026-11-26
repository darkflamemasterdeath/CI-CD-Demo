package com.example.demo.service;

import com.example.demo.model.User;
import com.example.demo.model.UserRequest;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * 用户数据服务：数据只放在内存 Map 里（相当于一个进程内缓存），
 * 不连数据库，应用重启后回到预置的假数据。
 */
@Service
public class UserService {

    private final Map<Long, User> store = new ConcurrentHashMap<>();
    private final AtomicLong idGenerator = new AtomicLong(0);

    public UserService() {
        // 预置几条假数据，前端一打开就能看到内容
        create(new UserRequest("张三", "zhangsan@example.com", "管理员"));
        create(new UserRequest("李四", "lisi@example.com", "开发者"));
        create(new UserRequest("王五", "wangwu@example.com", "测试"));
    }

    public List<User> list() {
        return store.values().stream()
                .sorted(Comparator.comparing(User::id))
                .toList();
    }

    public User get(Long id) {
        User user = store.get(id);
        if (user == null) {
            throw new NotFoundException("用户不存在: " + id);
        }
        return user;
    }

    public User create(UserRequest request) {
        if (request == null || request.name() == null || request.name().isBlank()) {
            throw new IllegalArgumentException("name 不能为空");
        }
        long id = idGenerator.incrementAndGet();
        User user = new User(
                id,
                request.name().trim(),
                request.email() == null ? "" : request.email().trim(),
                request.role() == null || request.role().isBlank() ? "访客" : request.role().trim());
        store.put(id, user);
        return user;
    }

    public void delete(Long id) {
        if (store.remove(id) == null) {
            throw new NotFoundException("用户不存在: " + id);
        }
    }

    public int count() {
        return store.size();
    }
}
