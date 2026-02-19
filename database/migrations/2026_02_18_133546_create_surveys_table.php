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
        Schema::create('surveys', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description');
            $table->date('start_date');
            $table->date('end_date');
            $table->string('trigger_word');
            $table->text('completion_message')->nullable();
            $table->text('invitation_message')->nullable();
            $table->timestamp('scheduled_time')->nullable();
            $table->enum('status', ['draft', 'active', 'completed', 'cancelled'])->default('draft');
            $table->json('branching_logic')->nullable(); // Store branching rules
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('surveys');
    }
};
