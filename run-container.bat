echo "Starting container!"
echo "Current directory is: %CD%"
docker run -it --network bridge --mount type=bind,source="%CD%",target=/opt/website -p 4000:4000 tsengia-website
