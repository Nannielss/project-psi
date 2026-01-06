<?php

namespace App\Http\Controllers;

use App\Models\Major;
use App\Models\Student;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PrintQRController extends Controller
{
    /**
     * Display the print QR page.
     */
    public function index(Request $request): Response
    {
        $majors = Major::orderBy('name')->get();
        $classes = Student::distinct()->orderBy('class')->pluck('class')->toArray();

        return Inertia::render('PrintQR/Index', [
            'majors' => $majors,
            'classes' => $classes,
            'filters' => $request->only(['category', 'search', 'major_id', 'class']),
        ]);
    }
}

