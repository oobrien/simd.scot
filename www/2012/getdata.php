<?php

ini_set("auto_detect_line_endings", true);

$year = htmlspecialchars($_POST['year']);
$ids = htmlspecialchars($_POST['ids']);

if (strlen($year) != 4) { return; }
if (!is_numeric($year)) { return; }

$file = 'data/00410767_plusintervals.csv';

if ($year == "2016")
{
	$file = 'data/simd2016_withinds.csv';
}

$ids_arr = explode(',', $ids);

header("Content-type: text/csv");
header("Content-Disposition: attachment; filename=simd" . $year . "_selecteddata.csv");
header("Pragma: no-cache");
header("Expires: 0");

sort($ids_arr);

$lines = file($file);
$data = array();

foreach ($lines as $line_num => $line) 
{    
	if ($line_num == 0)
	{
		print $line;
	}
    $id = substr($line, 0, strpos($line, ","));
    $data[$id] = $line;
}

foreach ($ids_arr as $id)
{
	if ($id != "")
	{
		print $data[$id];
	}
}

?>