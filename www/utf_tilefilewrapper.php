<?php
header('Content-Type: application/json');

$callback = htmlspecialchars($_GET['callback'], ENT_QUOTES);
$z = htmlspecialchars($_GET['z'], ENT_QUOTES);
$y = htmlspecialchars($_GET['y'], ENT_QUOTES);
$x = htmlspecialchars($_GET['x'], ENT_QUOTES);
$json_name = htmlspecialchars($_GET['json_name'], ENT_QUOTES);

echo $callback . "(";
$file = file_get_contents(/* Your server here */"/$json_name/$z/$x/$y.json");
echo $file;

if ($file == "")
{
	echo '{}';
}

echo ')';
?>
