# Render One Million Rows By Drawing

This project is a demonstration of how you can render 1 million rows in a table by drawing. I made use of the canvas API to achieve this task.

## Data source

I took this repository as my data source - https://github.com/datablist/sample-csv-files
. It contains sample CSV data for range of rows i.e. 0.5M, 1M rows etc.

## Inspiration

I got inspired to do this project when I was exploring how google sheet is able to render 0.5 million rows. I also got inspired by the glide apps data grid library that helped me understand the concept of canvas drawing: https://github.com/glideapps/glide-data-grid

## Approach

I took an approach of drawing each and every row of a CSV file on to a target canvas that displays these rows. Once the csv data is loaded, a worker is created that creates an offscreen canvas based on the scroll top value. This offscreen canvas will have a 100 rows drawn on to it.

I make use of `drawImage` function to blit the rows from offscreen canvas to the target canvas. This happens on every scroll.

Here is a short video that demonstrates ~1 Million rows drawn:

<video controls>
  <source src="src/assets/1M_rows.mov" type="video/mp4">
</video>

Also, was able to render ~2 Million rows as well:

<video controls>
  <source src="src/assets/2M_rows.mov" type="video/mp4">
</video>

## Future Enhancement

- Improve the current blitting approach by self blitting the target canvas
