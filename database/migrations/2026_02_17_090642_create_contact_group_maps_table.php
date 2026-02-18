<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('contact_group_maps', function (Blueprint $table) {
            $table->id();

            // owner (important for multi-tenant apps)
            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            // relations
            $table->foreignId('contact_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('contact_group_id')
                ->constrained()
                ->cascadeOnDelete();

            // snapshot fields
            $table->string('group');
            $table->string('phone');

            // status of mapping
            $table->enum('status', ['active', 'inactive'])
                ->default('active');

            $table->timestamps();

            // prevent duplicate mapping
            $table->unique(['contact_id', 'contact_group_id']);

            // performance indexes
            $table->index(['user_id', 'contact_group_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contact_group_maps');
    }
};
