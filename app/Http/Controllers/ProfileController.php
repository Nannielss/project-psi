<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
        
        // Handle photo upload (store privately)
        if ($request->hasFile('photo')) {
            // Delete old photo if exists (check both public and private storage for migration)
            if ($user->photo) {
                // Try to delete from private storage first
                if (Storage::disk('local')->exists($user->photo)) {
                    Storage::disk('local')->delete($user->photo);
                }
                // Also try public storage for old photos
                if (Storage::disk('public')->exists($user->photo)) {
                    Storage::disk('public')->delete($user->photo);
                }
            }
            
            // Store new photo privately
            $photoPath = $request->file('photo')->store('photos');
            $user->photo = $photoPath;
        }
        
        // Update username
        if ($request->filled('username')) {
            $user->username = $request->username;
        }
        
        $user->save();

        return Redirect::route('profile.edit');
    }

    /**
     * Serve private profile photos (requires authentication).
     */
    public function servePhoto(string $filename)
    {
        $path = "photos/{$filename}";

        // Check if file exists in private storage
        if (!Storage::disk('local')->exists($path)) {
            abort(404);
        }

        // Get the file and return as response
        $file = Storage::disk('local')->get($path);
        $mimeType = Storage::disk('local')->mimeType($path);

        return response($file, 200)->header('Content-Type', $mimeType);
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
