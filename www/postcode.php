<?php

sleep(0.5);

include_once "db.php";

global $pc;

if (!empty($_GET) && isset($_GET['pc']))
{
        $postcode = $_GET['pc'];
}
else if ($pc != null)
{
        $postcode = $pc;
}
else
{
        echo json_encode(array('success'=>false, 'message'=>'A postcode must be specified.'));
        return;
}

//Clean.
$postcode = strtoupper($postcode);
$postcode = str_replace(" ", "", $postcode);
$postcode = str_replace("'", "", $postcode);
$postcode = substr($postcode, 0, 7);

$conn = @mysqli_connect($dbhost, $dbuser, $dbpass);

if (!$conn)
{
        echo json_encode(array('success'=>false, 'message'=>'Unable to connect to the database.'));
        return;
}

if (strlen($postcode) < 5 || strlen($postcode) > 7)
{
        echo json_encode(array('success'=>false, 'message'=>'Unrecognised postcode format. Should be in the standard form, e.g. SW1 1AA.'));
        return;
}

$postcode = mysqli_real_escape_string($conn, $postcode);

mysqli_select_db($conn, $dbdb);
$rows = array();

$query1 = "SELECT easting, northing, postcode_ns from postcodes where postcode_ns = '" . $postcode . "' LIMIT 1"; 
$result = mysqli_query($conn, $query1);

if (mysqli_num_rows($result) == 0)
{
        echo json_encode(array('success'=>false, 'message'=>'Unable to find that postcode in the database.'));
}
else
{
        $row = mysqli_fetch_assoc($result);
        $returnData = array('success'=>true, 'message'=>'', 'easting'=>$row['easting'], 'northing'=>$row['northing'], 'postcode_ns'=>$row['postcode_ns']);
        echo json_encode($returnData);
}

?>
