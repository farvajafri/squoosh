set -e

docker build -t squoosh-rust - < ../rust.Dockerfile
docker run -it --rm -v $PWD:/src squoosh-rust "$@"
