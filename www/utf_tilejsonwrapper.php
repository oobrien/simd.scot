<?php 
header('Content-Type: application/json');

$callback = htmlspecialchars($_GET['callback'], ENT_QUOTES);
$json_name = htmlspecialchars($_GET['json_name'], ENT_QUOTES);

echo $callback . "(";
echo "
{
'tilejson' : '2.1.0',
'grids' : ['utf_tilefilewrapper.php?x={x}&y={y}&z={z}&json_name=$json_name'],
'scheme' : 'xyz',
'tiles' : [''],
'version' : '1.0.0'
}
";
echo ')';
?>
