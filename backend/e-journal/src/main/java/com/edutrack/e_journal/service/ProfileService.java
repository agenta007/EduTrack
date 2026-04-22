package com.edutrack.e_journal.service;

import com.edutrack.e_journal.dto.ChangePasswordRequest;
import com.edutrack.e_journal.dto.UserDto;
import com.edutrack.e_journal.entity.User;
import com.edutrack.e_journal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserService    userService;

    public UserDto getProfile(UserDetails principal) {
        // Retrieve the authenticated user's profile information and map it to a DTO
        return userService.toUserDto(userService.resolveUser(principal));
    }

    public void changePassword(UserDetails principal, ChangePasswordRequest req) {
        // Update the authenticated user's password after verifying the current credentials
        // Load the managed User entity from the security principal
        User user = userService.resolveUser(principal);
        // Validate the current password against the stored hash
        if (!passwordEncoder.matches(req.getCurrentPassword(), user.getPasswordHash()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        // Encode the new password and persist the updated entity
        user.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);
    }

    public void uploadPicture(UserDetails principal, MultipartFile file) throws IOException {
        // Validate the uploaded file is a non-empty image
        if (file.isEmpty() || file.getContentType() == null || !file.getContentType().startsWith("image/"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid image file");
    
        // Load the managed User entity from the security principal
        User user = userService.resolveUser(principal);
    
        // Update the user's profile picture bytes and MIME type
        user.setProfilePicture(file.getBytes());
        user.setProfilePictureType(file.getContentType());
    
        // Persist the changes to the database
        userRepository.save(user);
    }

    public UserDto updateBio(UserDetails principal, String bio) {
        // Update the authenticated user's biography with length validation
        String stripped = bio.strip();
        // Validate the bio length to prevent database overflow
        if (stripped.length() > 500)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bio must be 500 characters or fewer");
        // Load the managed User entity from the security principal
        User user = userService.resolveUser(principal);
        // Update the bio field, clearing it if the input is empty
        user.setBio(stripped.isEmpty() ? null : stripped);
        // Persist the changes to the database
        userRepository.save(user);
        // Return the updated user profile as a DTO
        return userService.toUserDto(user);
    }

    public void deletePicture(UserDetails principal) {
        // Remove profile picture data for the authenticated user
        // Load the managed User entity from the security principal
        User user = userService.resolveUser(principal);
        // Clear the profile picture URL and its associated MIME type
        user.setProfilePicture(null);
        user.setProfilePictureType(null);
        // Persist the changes to the database
        userRepository.save(user);
    }
}
