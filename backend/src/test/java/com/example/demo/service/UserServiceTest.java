package com.example.demo.service;

import com.example.demo.model.User;
import com.example.demo.model.UserRequest;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class UserServiceTest {

    private final UserService userService = new UserService();

    @Test
    void seedDataExists() {
        List<User> users = userService.list();
        assertThat(users).hasSizeGreaterThanOrEqualTo(30);
    }

    @Test
    void createAndGetUser() {
        User created = userService.create(new UserRequest("赵六", "zhaoliu@example.com", "开发者"));
        assertThat(created.id()).isNotNull();
        assertThat(userService.get(created.id()).name()).isEqualTo("赵六");
    }

    @Test
    void deleteUser() {
        User created = userService.create(new UserRequest("临时用户", "temp@example.com", "访客"));
        userService.delete(created.id());
        assertThatThrownBy(() -> userService.get(created.id()))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    void createWithBlankNameShouldFail() {
        assertThatThrownBy(() -> userService.create(new UserRequest("  ", "x@example.com", "访客")))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
