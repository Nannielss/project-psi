<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        
            $userData = null;
        if ($user) {
            $userData = [
                'id' => $user->id,
                'username' => $user->username,
                'role' => $user->role ?? null,
                'photo' => $user->photo ?? null,
                'avatar' => $user->photo ?? null, // Keep avatar for backward compatibility
                'teacher_id' => $user->teacher_id ?? null,
            ];
            
            // Load teacher relationship with subjects if teacher_id exists
            if ($user->teacher_id) {
                $user->load('teacher.subjects');
                $userData['teacher'] = $user->teacher ? [
                    'id' => $user->teacher->id,
                    'nip' => $user->teacher->nip,
                    'name' => $user->teacher->name,
                    'subjects' => $user->teacher->subjects->map(function ($subject) {
                        return [
                            'id' => $subject->id,
                            'nama' => $subject->nama,
                        ];
                    })->toArray(),
                ] : null;
            }
        }
        
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $userData,
            ],
        ];
    }
}
