# Render One Million Rows By Drawing

This project is a demonstration of how you can render 1 million rows in a table by drawing. I made use of the canvas API to achieve this task. 
I have also demonstrated this project as a part of the talk in Reactjs-pune meetup. Details about the talk can be found below:
* Slides - [Render Million Rows.pdf](https://github.com/keyurparalkar/render-million-rows/files/15064694/Render.Million.Rows.pdf)
* [Talk](https://www.meetup.com/reactjs-and-friends/events/299595472/)


## Data Source

I took this repository as my data source - [https://github.com/datablist/sample-csv-files](https://github.com/datablist/sample-csv-files). It contains sample CSV data for a range of rows, i.e., 0.5M, 1M rows, etc.

## Inspiration

I got inspired to do this project when I was exploring how Google Sheets are able to render 0.5 million rows. I also got inspired by the Glide Apps Data Grid library, which helped me understand the concept of canvas drawing: [https://github.com/glideapps/glide-data-grid](https://github.com/glideapps/glide-data-grid).

## Approach

I took an approach of drawing each and every row of a CSV file onto a target canvas that displays these rows. Once the CSV data is loaded, a worker is created that creates an offscreen canvas based on the scroll top value. This offscreen canvas will have 100 rows drawn onto it.

I make use of the `drawImage` function to blit the rows from the offscreen canvas to the target canvas. This happens on every scroll.

Here is a short video that demonstrates ~1 Million rows drawn:

[https://github.com/keyurparalkar/render-million-rows/assets/14138515/348a7267-651a-4b47-aa42-9472318effa4](https://github.com/keyurparalkar/render-million-rows/assets/14138515/348a7267-651a-4b47-aa42-9472318effa4)

Also, I was able to render ~2 Million rows as well:

[https://github.com/keyurparalkar/render-million-rows/assets/14138515/1cf80b9d-bd0c-449c-a0de-0322e1536a7b](https://github.com/keyurparalkar/render-million-rows/assets/14138515/1cf80b9d-bd0c-449c-a0de-0322e1536a7b)

## Future Enhancement

- Improve the current blitting approach by self-blitting the target canvas.
