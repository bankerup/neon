<?php

/* LAST-UPDATE: MAR, 5-SUNDAY 2016 01:46 PM
 *
 * PIGGY server script
 *
 * OWNER: bankerup.me
 *
 **/

/* ---------------------------------------------------------------------------------
 *
 * Set the content type for the data that will be used by the client
 *
 **/

header('Content-type: application/json; charset=utf-8');

/* ---------------------------------------------------------------------------------
 *
 * Constants used by the server
 *
 */

## General Constants

define('DOMAIN_NAME', 'localhost');
define('SITENAME', 'piggy');
define('MAX_EMAIL_LENGTH', 64);
define('MAX_NAME_LENGTH', 45);
define('MIN_PASSWORD_LENGTH', 8);

## Error codes

define('E_EMAIL_TOO_LONG', 1);
define('E_INVALID_EMAIL', 2);
define('E_NO_EMAIL', 3);
define('E_EMAIL_INUSE', 4);
define('E_DB_ERROR', 5);
define('E_NO_NAME', 6);
define('E_NAME_TOO_LONG', 7);
define('E_NAME_INVALID', 8);
define('E_NO_PASSWORD', 9);
define('E_PASSWORD_TOO_SHORT', 10);

## Database Constants

define('DB_USER', 'root');
define('DB_PASS', 'YY^^tt55');
define('DB_SERVER', 'localhost');
define('DB_NAME', 'piggydb');

## Session Constants

define('SS_NAME', SITENAME + '_sid');
define('SS_LIFETIME', time() + 604800); ## One week
define('SS_DESTROY_LIFETIME', time() - 604800);
define('SS_PATH', '/');
define('SS_DOMAIN', DOMAIN_NAME);

/* ---------------------------------------------------------------------------------
 *
 * Session configuration
 *
 **/

session_name('piggy_sid');
session_set_cookie_params(SS_LIFETIME, SS_PATH, SS_DOMAIN);
session_start();
setcookie(session_name(), session_id(), SS_LIFETIME, SS_PATH, SS_DOMAIN);

/* ---------------------------------------------------------------------------------
 *
 * Error handling
 *
 */

## DISPLAYING ERRORS SHOULD BE TURNED OFF IN PRODUCTION ENVIRONMENT <==
ini_set('display_errors', 1);
error_reporting(E_ALL);

function piggy_error_handler($errno, $errmsg, $filename, $filenum, $vars) {
    $date = date('F, j-D Y h:i A P');
    $msg = '<p>Date: ' . $date . '</p>';
    $msg = $msg . '<p>File: ' . $filename . ' : ' . $filenum . '</p>';
    $msg = $msg . '<p>Error number: ' . $errno . '</p>';
    $msg = $msg . '<p>Error message: ' . $errmsg . '</p><br>' . "\n";
    if(!error_log($msg, 3, 'piggy_error_log.html')) {
        ## DO NOTHING
        ## echo json_encode(array("success" => FALSE, "error" => "internal error 0x0001"));
    }

}

set_error_handler('piggy_error_handler');

/* ---------------------------------------------------------------------------------
 *
 * Connecting to the database
 *
 */

$piggy_db = new mysqli(DB_SERVER, DB_USER, DB_PASS, DB_NAME);
if($piggy_db->connect_error) {
    /*
     * Terminate the script if we are unable to connect to the DB server
     */
    echo json_encode(array('success' => FALSE, 'error' => 'internal error 0x0002'));
    exit();
}
$piggy_db->set_charset('utf8');

/* ---------------------------------------------------------------------------------
 *
 * General functions
 *
 */

/*
 * Send the data to the client and terminate the execution
 */

function response(array $output) {
    echo json_encode($output);
    exit();
}

/*
 * Get the data from $_POST
 */
function get($what) {
    if(!empty($_POST[$what])) {
        return $_POST[$what];
    }
    if(!empty($_GET[$what])) {
        return $_GET[$what];
    }
    return NULL;   
}

/*
 * Check if the email address is valid
 */

function is_valid_email($email) {
    if(empty($email)) {
        return E_NO_EMAIL;
    }
    if(strlen($email) > MAX_EMAIL_LENGTH) {
        return E_EMAIL_TOO_LONG;
    }
    if(preg_match('/^[a-zA-Z0-9_]+([\.|\-]*[a-zA-Z0-9_]+)*@[a-zA-Z0-9_]+([\.|\-]*[a-zA-Z0-9_]+)*\.[a-zA-Z]{2,3}$/', $email) != 1) {
        return E_INVALID_EMAIL;
    }
    /*
     * Make sure that the email address isn't already in use
     */
    ## Inorder to use $piggy_db inside this function i should declare it as global
    global $piggy_db;
    ## Please note we don't need to use the real_escape_string
    ## TO BE UPDATED
    ## SELECT statment should count the email if it is activated
    $query = "SELECT count(*) AS already_used FROM users WHERE email='" . $piggy_db->real_escape_string($email) . "'";
    if(($result = $piggy_db->query($query)) === FALSE) {
        return E_DB_ERROR;
    }
    if(($row = $result->fetch_assoc()) === NULL) {
        return E_DB_ERROR;
    }
    if($row['already_used'] != 0) {
        return E_EMAIL_INUSE;
    }
    return TRUE;
}

/*
 * Check if the name is valid
 */

function is_valid_name($name) {
    if(empty($name)) {
        return E_NO_NAME;
    }
    if(strlen($name) > MAX_NAME_LENGTH) {
        return E_NAME_TOO_LONG;
    }
    if(preg_match('/^[a-zA-Z]+([\ ]?[a-zA-Z]+)*$/', $name) != 1) {
        return E_NAME_INVALID;
    }
    return TRUE;
}

/*
 * Check if the password is valid
 */

function is_valid_password($password) {
    if(empty($password)) {
        return E_NO_PASSWORD;
    }
    if(strlen($password) < MIN_PASSWORD_LENGTH) {
        return E_PASSWORD_TOO_SHORT;
    }
    return TRUE;
}

/* ---------------------------------------------------------------------------------
 *
 * The Router
 * Calls the requested method
 *
 */

## Check for errors

if(empty(get('method'))) {
    response(array('success' => FALSE, 'error' => 'No method was selected'));
}

switch(get('method')) {
    case 'add_new_user': add_new_user(); break;
    case 'login': login(); break;
    case 'user_avatar': user_avatar(); break;
    case 'logout': logout(); break;
    case 'get_user_info': get_user_info(); break;
    case 'get_files': get_files(); break;
    case 'get_more_files': get_more_files(); break;
    case 'get_more_files_search': get_more_files_search(); break;
    case 'get_file': get_file(); break;
    case 'get_file_thumb': get_file_thumb(); break;
    case 'get_the_file': get_the_file(); break;
    case 'add_new_file': add_new_file(); break;
    case 'append_data': append_data(); break;
    case 'close_file': close_file(); break;
    case 'search_for_files': search_for_files(); break;
    case 'search_for_files_get': search_for_files_get(); break;
    default: response(array('success' => FALSE, 'error' => 'Undefined method'));
}

/* ---------------------------------------------------------------------------------
 *
 * APIs that deal with users management
 *
 */

function add_new_user() {
    /**
     * Validate the data
     */

    ## Validate the name
    if(($res = is_valid_name(get('name'))) !== TRUE) {
        switch($res) {
            case E_NO_NAME:
                response(array('success' => FALSE, 'error' => 'No name was provided'));
            case E_NAME_TOO_LONG:
                response(array('success' => FALSE, 'error' => 'The name is too long'));
            case E_NAME_INVALID:
                response(array('success' => FALSE, 'error' => 'Invalid name'));
            default:
                response(array('success' => FALSE, 'error' => 'Internal error 0x0004'));
        }
    }

    ## Validate the email address
    if(($res = is_valid_email(get('email'))) !== TRUE) {
        switch($res) {
            case E_NO_EMAIL:
                response(array('success' => FALSE, 'error' => 'No email address was provided'));
            case E_EMAIL_TOO_LONG:
                response(array('success' => FALSE, 'error' => 'The email address is too long'));
            case E_INVALID_EMAIL:
                response(array('success' => FALSE, 'error' => 'Invalid email address'));
            case E_EMAIL_INUSE:
                response(array('success' => FALSE, 'error' => 'Please select another email address'));
            default:
                response(array('success' => FALSE, 'error' => 'Internal error 0x0003'));
        }
    }

    ## Validate the password
    if(($res = is_valid_password(get('password'))) !== TRUE) {
        switch($res) {
            case E_NO_PASSWORD:
                response(array('success' => FALSE, 'error' => 'No password was provided'));
            case E_PASSWORD_TOO_SHORT:
                response(array('success' => FALSE, 'error' => 'The password is too short'));
            default:
                response(array('success' => FALSE, 'error' => 'Internal error 0x0005'));
        }
    }
    response(array("success" => TRUE));
}

function login() {
    /**
     * Validate the data
     */

    ## Validate the email address
    if((($res = is_valid_email(get('email'))) !== TRUE) && ($res != E_EMAIL_INUSE)) {
        switch($res) {
            case E_NO_EMAIL:
                response(array('success' => FALSE, 'error' => 'No email address was provided'));
            case E_EMAIL_TOO_LONG:
                response(array('success' => FALSE, 'error' => 'The email address is too long'));
            case E_INVALID_EMAIL:
                response(array('success' => FALSE, 'error' => 'Invalid email address'));
            default:
                response(array('success' => FALSE, 'error' => 'Internal error 0x0006'));
        }
    }

    ## Validate the password
    if(($res = is_valid_password(get('password'))) !== TRUE) {
        switch($res) {
            case E_NO_PASSWORD:
                response(array('success' => FALSE, 'error' => 'No password was provided'));
            case E_PASSWORD_TOO_SHORT:
                response(array('success' => FALSE, 'error' => 'The password is too short'));
            default:
                response(array('success' => FALSE, 'error' => 'Internal error 0x0007'));
        }
    }
    global $piggy_db;
    $query = "SELECT id FROM users WHERE email='" . $piggy_db->real_escape_string(get('email')) . "' AND password='" . hash('sha256', get('password')) . "'";
    if(($res = $piggy_db->query($query)) === FALSE) {
        response(array('success' => FALSE, 'error' => 'Internal error 0x0008'));
    }
    if($res->num_rows !== 1) {
        response(array('success' => FALSE, 'error' => 'Invalid credentials'));
    }
    if(($row = $res->fetch_assoc()) === NULL) {
        response(array('success' => FALSE, 'error' => 'Internal error 0x0009'));
    }
    $_SESSION['user_id'] = $row['id'];
    response(array('success' => TRUE));
}

function get_user_info() {
    if(empty($_SESSION['user_id'])) {
        response(array('success' => TRUE, 'logged_in' => FALSE));
    }
    global $piggy_db;
    $query = "SELECT name, registration_date, last_login FROM users WHERE id=" . $_SESSION['user_id'] ;
    if(($res = $piggy_db->query($query)) === FALSE) {
        response(array('success' => FALSE, 'error' => 'Internal error 0x000A'));
    }
    if($res->num_rows !== 1) {
        response(array('success' => FALSE, 'error' => 'Internal error 0x000B'));
    }
    if(($row = $res->fetch_assoc()) === NULL) {
        response(array('success' => FALSE, 'error' => 'Internal error 0x000C'));
    }
    response(array('success' => TRUE, 'logged_in' => TRUE, 'name' => $row['name'], 'registration_date' => $row['registration_date'], 'last_login' => $row['last_login']));
}

// Return the user's avatar

function user_avatar() {
    header('Content-Disposition: inline');
    if(empty($_SESSION['user_id'])) {
        header('Content-type: image/svg+xml');
        header('X-Sendfile: ' . __DIR__ . '/assets/images/user.svg');
    } else {
        header('Content-type: image/png');
        header('X-Sendfile: ' . __DIR__ . '/avatar/' . $_SESSION['user_id'] . '.png');
    }
}

function logout() {
    session_destroy();
    session_set_cookie_params(SS_DESTROY_LIFETIME, SS_PATH, SS_DOMAIN);
    setcookie(session_name(), '', SS_DESTROY_LIFETIME, SS_PATH, SS_DOMAIN);
    response(array("success" => TRUE));
}

/* ---------------------------------------------------------------------------------
 *
 * APIs that deal with files management
 *
 */

function get_files() {
    global $piggy_db;
    $query = "SELECT id, name, size, type, owner FROM files ORDER BY id DESC LIMIT 10";
    if(($res = $piggy_db->query($query)) === FALSE) {
        response(array('success' => FALSE, 'error' => 'Internal error 0x000D'));
    }
    if($res->num_rows <= 0) {
        response(array('success' => TRUE, 'number_of_files' => 0));
    }
    $number_of_files = $res->num_rows;
    while(($row = $res->fetch_assoc()) != NULL) {
        $data['id'][] = $row['id'];
        $data['name'][] = $row['name'];
        $data['size'][] = $row['size'];
        //$data['type'][] = $row['type'];
        //$data['owner'][] = $row['owner'];
    }
    response(array('success' => TRUE, 'number_of_files' => $number_of_files, 'files' => $data));
}

function get_more_files() {
    global $piggy_db;
    $last_file = get('last_file');
    $query = "SELECT id, name, size, type, owner FROM files WHERE id < {$last_file} ORDER BY id DESC LIMIT 10";
    if(($res = $piggy_db->query($query)) === FALSE) {
        response(array('success' => FALSE, 'error' => 'Internal error 0x000D'));
    }
    if($res->num_rows <= 0) {
        response(array('success' => TRUE, 'number_of_files' => 0));
    }
    $number_of_files = $res->num_rows;
    while(($row = $res->fetch_assoc()) != NULL) {
        $data['id'][] = $row['id'];
        $data['name'][] = $row['name'];
        $data['size'][] = $row['size'];
        //$data['type'][] = $row['type'];
        //$data['owner'][] = $row['owner'];
    }
    response(array('success' => TRUE, 'number_of_files' => $number_of_files, 'files' => $data));
}

function get_more_files_search() {
    global $piggy_db;
    $last_file = get('last_file');
    $name = get('name');
    $query = "SELECT id, name, size, type, owner FROM files WHERE id < {$last_file} AND name LIKE '%{$name}%' ORDER BY id DESC LIMIT 10";
    if(($res = $piggy_db->query($query)) === FALSE) {
        response(array('success' => FALSE, 'error' => 'Internal error 0x000D'));
    }
    if($res->num_rows <= 0) {
        response(array('success' => TRUE, 'number_of_files' => 0));
    }
    $number_of_files = $res->num_rows;
    while(($row = $res->fetch_assoc()) != NULL) {
        $data['id'][] = $row['id'];
        $data['name'][] = $row['name'];
        $data['size'][] = $row['size'];
        //$data['type'][] = $row['type'];
        //$data['owner'][] = $row['owner'];
    }
    response(array('success' => TRUE, 'number_of_files' => $number_of_files, 'files' => $data));
}

function get_file() {
    global $piggy_db;
    $last_file = get('file_id');
    $query = "SELECT id, name, size, type, owner FROM files WHERE id = {$last_file}";
    if(($res = $piggy_db->query($query)) === FALSE) {
        response(array('success' => FALSE, 'error' => 'Internal error 0x000D'));
    }
    if($res->num_rows <= 0) {
        response(array('success' => TRUE, 'number_of_files' => 0));
    }
    $number_of_files = $res->num_rows;
    while(($row = $res->fetch_assoc()) != NULL) {
        $data['id'][] = $row['id'];
        $data['name'][] = $row['name'];
        $data['size'][] = $row['size'];
        //$data['type'][] = $row['type'];
        //$data['owner'][] = $row['owner'];
    }
    response(array('success' => TRUE, 'number_of_files' => $number_of_files, 'files' => $data));
}


function get_file_thumb() {
    header('Content-Disposition: inline');
    ## TO DO CHECK
    $file_id = get("file_id");
    if(empty($file_id) || !(file_exists(__DIR__ . '/filescenter/' . $file_id . '.jpg'))) {
        header('Content-type: image/png');
        header('X-Sendfile: ' . __DIR__ . '/assets/images/thumb.png');
        exit();
    }
    header('Content-type: image/png');
    header('X-Sendfile: ' . __DIR__ . '/filescenter/' . $file_id . '.jpg');
}

function get_the_file() {
    global $piggy_db;
    $file_id = get('file_id');
    $query = "SELECT name, size, type FROM files WHERE id='" . $piggy_db->real_escape_string($file_id) . "'";
    if(($res = $piggy_db->query($query)) === FALSE) {
        response(array('success' => FALSE, 'errors' => 'Internal error 0x000E'));
    }
    if($res->num_rows != 1) {
        response(array('success' => FALSE, 'errors' => 'File not found'));
    }
    if(($row = $res->fetch_assoc()) == NULL) {
        response(array('success' => FALSE, 'errors' => 'Internal error 0x000F'));
    }
    header('Content-Disposition: attachment; filename="' . $row['name'] . '"');
    header('Content-Type: ' . $row['type']);
    header('Content-Length: ' . $row['size']);
    header('X-Sendfile: ' . __DIR__ . '/filescenter/' . $file_id);
}

function add_new_file()
{
    global $piggy_db;
    $name = get('name');
    $size = get('size');
    $type = get('type');
    $user_id = $_SESSION['user_id'];
    $query = "INSERT INTO files(name, size, status, type, owner) VALUES('{$name}', {$size}, 0, '{$type}', {$user_id})";
    if(($res = $piggy_db->query($query)) == FALSE) {
        response(array('success' => FALSE, 'errors' => 'Internal error 0x0010' . $query));
    }
    response(array('success' => TRUE, 'id' => $piggy_db->insert_id));
}

function append_data()
{
    $file = fopen(__DIR__ . '/filescenter/' . $_POST['id'] , 'cb');
    fseek($file, get('location'));
    fwrite($file, file_get_contents($_FILES['data']['tmp_name']));
    fclose($file);
}

function close_file()
{
    global $piggy_db;
    $id = get('id');
    $query = "UPDATE files SET status=1 WHERE id={$id}";
    if(($res = $piggy_db->query($query)) == FALSE) {
        response(array('success' => FALSE, 'errors' => 'Internal error 0x0011'));
    }
    if($piggy_db->mysql_affected_rows() != 1) {
        response(array('success' => FALSE, 'errors' => 'Internal error 0x0012'));
    }
    response(array('success' => TRUE));
}

function search_for_files()
{
    global $piggy_db;
    $name = get('name');
    $query = "SELECT id, name FROM files WHERE name LIKE '%{$name}%' ORDER BY id DESC LIMIT 10";
    if(($res = $piggy_db->query($query)) == FALSE) {
        response(array('success' => FALSE, 'errors' => 'Internal error 0x0013'));
    }
    $no_of_files = $res->num_rows;
    while($row = $res->fetch_assoc()) {
        $file_id[] = $row['id'];
        $file_name[] = $row['name'];
    }
    response(array('success' => TRUE, 'no_of_files' => $no_of_files, 'id' => $file_id, 'name' => $file_name));
}

function search_for_files_get() {
    global $piggy_db;
    $name = get('name');
    $query = "SELECT id, name, size, type, owner FROM files WHERE name LIKE '%{$name}%' ORDER BY id DESC LIMIT 10";
    if(($res = $piggy_db->query($query)) === FALSE) {
        response(array('success' => FALSE, 'error' => 'Internal error 0x000D'));
    }
    if($res->num_rows <= 0) {
        response(array('success' => TRUE, 'number_of_files' => 0));
    }
    $number_of_files = $res->num_rows;
    while(($row = $res->fetch_assoc()) != NULL) {
        $data['id'][] = $row['id'];
        $data['name'][] = $row['name'];
        $data['size'][] = $row['size'];
        //$data['type'][] = $row['type'];
        //$data['owner'][] = $row['owner'];
    }
    response(array('success' => TRUE, 'number_of_files' => $number_of_files, 'files' => $data));
}
