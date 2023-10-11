<?php
if (!defined('ABSPATH')) {
  exit();
}

class Probot_Admin
{
  public function my_admin_menu()
  {
    add_menu_page(
      'Probot Settings',
      'Probot',
      'manage_options',
      'probot/settings.php',
      [$this, 'probot_settings_callback'],
      'dashicons-format-chat',
      250
    );
  }

  public function probot_settings_callback()
  {
    require_once 'partials/probot-admin-display.php';
  }

  public function register_probot_settings()
  {
    register_setting('probot', 'init_snippet');
    register_setting('probot', 'excluded_pages');
  }
}
