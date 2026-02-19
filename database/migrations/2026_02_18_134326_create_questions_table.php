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
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('survey_id')->constrained()->onDelete('cascade');
            $table->string('question');
            $table->enum('response_type', ['free-text', 'multiple-choice']);
            $table->text('free_text_description')->nullable();
            $table->boolean('allow_multiple')->default(false);
            $table->integer('order')->default(0);
            $table->json('branching')->nullable(); // Store branching rules
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('questions');
    }
};
