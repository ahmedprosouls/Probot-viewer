<?php

/**
 * Plugin Name:       Probot
 * Description:       Convert more with conversational forms
 * Version:           3.3.0
 * Author:            Probot
 * Author URI:        http://probot.io/
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       probot
 * Domain Path:       /languages
 */

if (!defined('WPINC')) {
  die();
}

define('PROBOT_VERSION', '3.3.0');

function activate_probot()
{
  require_once plugin_dir_path(__FILE__) .
    'includes/class-probot-activator.php';
  Probot_Activator::activate();
}

function deactivate_probot()
{
  require_once plugin_dir_path(__FILE__) .
    'includes/class-probot-deactivator.php';
  Probot_Deactivator::deactivate();
}

register_activation_hook(__FILE__, 'activate_probot');
register_deactivation_hook(__FILE__, 'deactivate_probot');

require plugin_dir_path(__FILE__) . 'includes/class-probot.php';

function run_probot()
{
  $plugin = new Probot();
  $plugin->run();
}
run_probot();
