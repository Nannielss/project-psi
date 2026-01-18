<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Crypt;

class DeviceLocation extends Model
{
    protected $fillable = [
        'name',
        'password',
        'password_plain',
        'is_active',
    ];

    protected $hidden = [
        // Password is not hidden to be explicitly managed for display
    ];

    protected $appends = ['plain_password']; // Append decrypted password to JSON

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get the tool loans for this device location.
     */
    public function toolLoans(): HasMany
    {
        return $this->hasMany(ToolLoan::class);
    }

    /**
     * Set the password attribute (hash it and encrypt plain text).
     */
    public function setPasswordAttribute($value): void
    {
        if (!empty($value)) {
            $this->attributes['password'] = Hash::make($value);
            $this->attributes['password_plain'] = Crypt::encryptString($value);
        }
    }

    /**
     * Get the plain password attribute (decrypted).
     */
    public function getPlainPasswordAttribute(): ?string
    {
        if (empty($this->password_plain)) {
            return null;
        }
        try {
            return Crypt::decryptString($this->attributes['password_plain']);
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Verify password.
     */
    public function verifyPassword(string $password): bool
    {
        return Hash::check($password, $this->password);
    }
}